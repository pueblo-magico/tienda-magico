#!/usr/bin/env bash
# Pueblo Mágico — deploy storefront + Payload CMS on a single Google Cloud VM.
#
# Run on the VM (recommended) or via: ./deploy.sh remote <subcommand>
#
# Examples:
#   sudo ./deploy/gce/deploy.sh bootstrap
#   sudo ./deploy/gce/deploy.sh configure --shop-host shop.example.com --cms-host cms.example.com
#   sudo ./deploy/gce/deploy.sh deploy
#   ./deploy/gce/deploy.sh status
#   ./deploy/gce/deploy.sh remote deploy --project my-gcp --zone us-central1-a --instance tm-prod
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Defaults (override with flags or env)
TM_APP_USER="${TM_APP_USER:-tienda}"
TM_APP_DIR="${TM_APP_DIR:-/opt/tienda-magico}"
TM_ENV_DIR="${TM_ENV_DIR:-/etc/tienda-magico}"
TM_SHOP_HOST="${TM_SHOP_HOST:-shop.example.com}"
TM_CMS_HOST="${TM_CMS_HOST:-cms.example.com}"
TM_NODE_MAJOR="${TM_NODE_MAJOR:-22}"
TM_BRANCH="${TM_BRANCH:-main}"
TM_GIT_URL="${TM_GIT_URL:-}"
TM_SKIP_BUILD="${TM_SKIP_BUILD:-0}"
TM_SKIP_NGINX="${TM_SKIP_NGINX:-0}"
GCP_PROJECT="${GCP_PROJECT:-}"
GCP_ZONE="${GCP_ZONE:-}"
GCP_INSTANCE="${GCP_INSTANCE:-}"

log()  { printf '==> %s\n' "$*"; }
warn() { printf '!!  %s\n' "$*" >&2; }
die()  { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

is_root() { [[ "${EUID:-$(id -u)}" -eq 0 ]]; }

require_root() {
  is_root || die "Run as root (sudo) for this subcommand."
}

usage() {
  cat <<'EOF'
Usage: deploy.sh <command> [options]

Commands:
  bootstrap     Install Node.js, Docker, nginx, app user (once per VM)
  configure     Install systemd units, nginx site, env file templates
  db-up         Start Postgres (Docker, bound to 127.0.0.1:5433)
  deploy        Sync/pull code, npm ci, build, restart services
  restart       Restart web + cms systemd units
  status        Show service / HTTP health
  logs [web|cms|all]   Follow journald logs
  remote <cmd>  Run a command on the GCE VM via gcloud compute ssh

Options:
  --app-dir DIR         App path (default: /opt/tienda-magico)
  --env-dir DIR         Env path (default: /etc/tienda-magico)
  --shop-host HOST      Storefront server_name
  --cms-host HOST       CMS server_name
  --branch NAME         Git branch for pull deploys (default: main)
  --git-url URL         Clone URL if app dir is empty
  --skip-build          Restart only (no npm ci / build)
  --skip-nginx          Do not touch nginx during configure
  --project ID          GCP project (remote)
  --zone ZONE           GCP zone (remote)
  --instance NAME       GCE instance name (remote)
  -h, --help            Show help

Environment files (create after configure, chmod 600):
  /etc/tienda-magico/storefront.env
  /etc/tienda-magico/cms.env
  /etc/tienda-magico/postgres.env   (POSTGRES_PASSWORD=...)

See docs/deploy/gce.md for full instructions.
EOF
}

parse_args() {
  COMMAND="${1:-}"
  [[ -n "$COMMAND" ]] || { usage; exit 1; }
  shift || true

  REMOTE_ARGS=()
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --app-dir) TM_APP_DIR="${2:-}"; shift 2 ;;
      --env-dir) TM_ENV_DIR="${2:-}"; shift 2 ;;
      --shop-host) TM_SHOP_HOST="${2:-}"; shift 2 ;;
      --cms-host) TM_CMS_HOST="${2:-}"; shift 2 ;;
      --branch) TM_BRANCH="${2:-}"; shift 2 ;;
      --git-url) TM_GIT_URL="${2:-}"; shift 2 ;;
      --skip-build) TM_SKIP_BUILD=1; shift ;;
      --skip-nginx) TM_SKIP_NGINX=1; shift ;;
      --project) GCP_PROJECT="${2:-}"; shift 2 ;;
      --zone) GCP_ZONE="${2:-}"; shift 2 ;;
      --instance) GCP_INSTANCE="${2:-}"; shift 2 ;;
      -h|--help) usage; exit 0 ;;
      *)
        REMOTE_ARGS+=("$1")
        shift
        ;;
    esac
  done
}

detect_pkg_manager() {
  if command -v apt-get >/dev/null 2>&1; then
    echo apt
  elif command -v dnf >/dev/null 2>&1; then
    echo dnf
  else
    die "Unsupported OS (need apt or dnf)."
  fi
}

install_node() {
  if command -v node >/dev/null 2>&1; then
    local major
    major="$(node -p "process.versions.node.split('.')[0]" 2>/dev/null || echo 0)"
    if [[ "$major" -ge 20 ]]; then
      log "Node.js already installed: $(node -v)"
      return
    fi
  fi

  log "Installing Node.js ${TM_NODE_MAJOR}.x"
  local pm
  pm="$(detect_pkg_manager)"
  if [[ "$pm" == apt ]]; then
    need_cmd curl
    curl -fsSL "https://deb.nodesource.com/setup_${TM_NODE_MAJOR}.x" | bash -
    apt-get install -y nodejs
  else
    dnf module disable -y nodejs || true
    dnf install -y "nodejs${TM_NODE_MAJOR}" || dnf install -y nodejs
  fi
  node -v
  npm -v
}

install_docker() {
  if command -v docker >/dev/null 2>&1; then
    log "Docker already installed: $(docker -v)"
  else
    log "Installing Docker"
    local pm
    pm="$(detect_pkg_manager)"
    if [[ "$pm" == apt ]]; then
      apt-get install -y ca-certificates curl gnupg
      install -m 0755 -d /etc/apt/keyrings
      if [[ ! -f /etc/apt/keyrings/docker.gpg ]]; then
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        chmod a+r /etc/apt/keyrings/docker.gpg
      fi
      # Best-effort Ubuntu/Debian repo; fall back to distro docker.io
      . /etc/os-release
      if [[ "${ID:-}" == "ubuntu" || "${ID:-}" == "debian" ]]; then
        echo \
          "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/${ID} ${VERSION_CODENAME} stable" \
          > /etc/apt/sources.list.d/docker.list
        apt-get update -y
        apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin || \
          apt-get install -y docker.io docker-compose-v2 || apt-get install -y docker.io
      else
        apt-get install -y docker.io
      fi
    else
      dnf install -y docker docker-compose-plugin || dnf install -y docker
    fi
  fi

  systemctl enable --now docker
  if id "${TM_APP_USER}" &>/dev/null; then
    usermod -aG docker "${TM_APP_USER}" || true
  fi
}

install_nginx() {
  if command -v nginx >/dev/null 2>&1; then
    log "nginx already installed"
    return
  fi
  log "Installing nginx"
  local pm
  pm="$(detect_pkg_manager)"
  if [[ "$pm" == apt ]]; then
    apt-get install -y nginx
  else
    dnf install -y nginx
  fi
  systemctl enable --now nginx
}

ensure_app_user() {
  if id "${TM_APP_USER}" &>/dev/null; then
    log "User ${TM_APP_USER} exists"
  else
    log "Creating system user ${TM_APP_USER}"
    useradd --system --create-home --home-dir "/home/${TM_APP_USER}" --shell /usr/sbin/nologin "${TM_APP_USER}"
  fi
  mkdir -p "${TM_APP_DIR}" "${TM_ENV_DIR}"
  chown -R "${TM_APP_USER}:${TM_APP_USER}" "${TM_APP_DIR}"
  chmod 755 "${TM_ENV_DIR}"
}

cmd_bootstrap() {
  require_root
  log "Bootstrapping GCE VM for Pueblo Mágico"

  local pm
  pm="$(detect_pkg_manager)"
  if [[ "$pm" == apt ]]; then
    apt-get update -y
    apt-get install -y ca-certificates curl gnupg git rsync jq ufw build-essential python3
  else
    dnf install -y ca-certificates curl git rsync jq firewalld gcc-c++ make python3
  fi

  ensure_app_user
  install_node
  install_docker
  install_nginx

  # Firewall: allow SSH + HTTP/S (GCP VPC firewall must also allow)
  if command -v ufw >/dev/null 2>&1; then
    ufw allow OpenSSH || true
    ufw allow 80/tcp || true
    ufw allow 443/tcp || true
    ufw --force enable || true
  fi

  log "Bootstrap complete."
  log "Next: put code in ${TM_APP_DIR}, then:"
  log "  sudo $0 configure --shop-host YOUR_SHOP_HOST --cms-host YOUR_CMS_HOST"
  log "  # edit ${TM_ENV_DIR}/storefront.env and cms.env"
  log "  sudo $0 db-up && sudo $0 deploy"
}

render_nginx() {
  local src="${SCRIPT_DIR}/nginx/tienda-magico.conf"
  local dest="/etc/nginx/sites-available/tienda-magico.conf"
  local enabled="/etc/nginx/sites-enabled/tienda-magico.conf"

  mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
  sed \
    -e "s/shop\\.example\\.com/${TM_SHOP_HOST//\//\\/}/g" \
    -e "s/cms\\.example\\.com/${TM_CMS_HOST//\//\\/}/g" \
    "$src" > "$dest"

  ln -sfn "$dest" "$enabled"
  # Disable default site if present
  rm -f /etc/nginx/sites-enabled/default

  nginx -t
  systemctl reload nginx
  log "nginx configured for ${TM_SHOP_HOST} + ${TM_CMS_HOST}"
}

install_systemd_units() {
  local unit_dir="${SCRIPT_DIR}/systemd"
  sed "s|/opt/tienda-magico|${TM_APP_DIR}|g; s|User=tienda|User=${TM_APP_USER}|g; s|Group=tienda|Group=${TM_APP_USER}|g; s|/etc/tienda-magico|${TM_ENV_DIR}|g" \
    "${unit_dir}/tienda-magico-web.service" > /etc/systemd/system/tienda-magico-web.service
  sed "s|/opt/tienda-magico|${TM_APP_DIR}|g; s|User=tienda|User=${TM_APP_USER}|g; s|Group=tienda|Group=${TM_APP_USER}|g; s|/etc/tienda-magico|${TM_ENV_DIR}|g" \
    "${unit_dir}/tienda-magico-cms.service" > /etc/systemd/system/tienda-magico-cms.service

  systemctl daemon-reload
  systemctl enable tienda-magico-web.service tienda-magico-cms.service
  log "systemd units installed and enabled"
}

seed_env_files() {
  mkdir -p "${TM_ENV_DIR}"
  if [[ ! -f "${TM_ENV_DIR}/storefront.env" ]]; then
    sed \
      -e "s|https://shop.example.com|https://${TM_SHOP_HOST}|g" \
      -e "s|https://cms.example.com|https://${TM_CMS_HOST}|g" \
      "${SCRIPT_DIR}/env/storefront.env.example" > "${TM_ENV_DIR}/storefront.env"
    chmod 600 "${TM_ENV_DIR}/storefront.env"
    log "Created ${TM_ENV_DIR}/storefront.env (EDIT SECRETS)"
  else
    log "Keeping existing ${TM_ENV_DIR}/storefront.env"
  fi

  if [[ ! -f "${TM_ENV_DIR}/cms.env" ]]; then
    sed \
      -e "s|https://shop.example.com|https://${TM_SHOP_HOST}|g" \
      -e "s|https://cms.example.com|https://${TM_CMS_HOST}|g" \
      "${SCRIPT_DIR}/env/cms.env.example" > "${TM_ENV_DIR}/cms.env"
    chmod 600 "${TM_ENV_DIR}/cms.env"
    log "Created ${TM_ENV_DIR}/cms.env (EDIT SECRETS)"
  else
    log "Keeping existing ${TM_ENV_DIR}/cms.env"
  fi

  if [[ ! -f "${TM_ENV_DIR}/postgres.env" ]]; then
    cat > "${TM_ENV_DIR}/postgres.env" <<EOF
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)
POSTGRES_DB=tienda_magico_cms
EOF
    chmod 600 "${TM_ENV_DIR}/postgres.env"
    log "Created ${TM_ENV_DIR}/postgres.env with generated password"
  fi

  # Restrict directory
  chown root:root "${TM_ENV_DIR}"
  chmod 755 "${TM_ENV_DIR}"
  chown root:"${TM_APP_USER}" "${TM_ENV_DIR}"/*.env 2>/dev/null || true
  chmod 640 "${TM_ENV_DIR}"/*.env 2>/dev/null || true
}

sync_cms_dotenv() {
  # Payload/next in apps/cms conventionally reads apps/cms/.env
  local cms_env="${TM_ENV_DIR}/cms.env"
  local dest="${TM_APP_DIR}/apps/cms/.env"
  if [[ -f "$cms_env" ]]; then
    install -o "${TM_APP_USER}" -g "${TM_APP_USER}" -m 600 "$cms_env" "$dest"
    log "Synced CMS env → ${dest}"
  fi

  local web_env="${TM_ENV_DIR}/storefront.env"
  local web_dest="${TM_APP_DIR}/.env.production.local"
  if [[ -f "$web_env" ]]; then
    # Next.js loads .env.production.local at build and runtime
    install -o "${TM_APP_USER}" -g "${TM_APP_USER}" -m 600 "$web_env" "$web_dest"
    # Also provide .env.local for any tooling that expects it
    install -o "${TM_APP_USER}" -g "${TM_APP_USER}" -m 600 "$web_env" "${TM_APP_DIR}/.env.local"
    log "Synced storefront env → ${web_dest}"
  fi
}

cmd_configure() {
  require_root
  [[ -d "${SCRIPT_DIR}/systemd" ]] || die "Missing deploy assets; run from a full checkout."

  # Prefer assets from installed app tree when present
  if [[ -d "${TM_APP_DIR}/deploy/gce/systemd" ]]; then
    SCRIPT_DIR="${TM_APP_DIR}/deploy/gce"
  fi

  seed_env_files
  install_systemd_units
  if [[ "${TM_SKIP_NGINX}" != "1" ]]; then
    render_nginx
  fi
  log "Configure done. Edit env files under ${TM_ENV_DIR} before deploy."
}

cmd_db_up() {
  require_root
  need_cmd docker
  local compose="${SCRIPT_DIR}/docker-compose.postgres.yml"
  if [[ -f "${TM_APP_DIR}/deploy/gce/docker-compose.postgres.yml" ]]; then
    compose="${TM_APP_DIR}/deploy/gce/docker-compose.postgres.yml"
  fi
  [[ -f "${TM_ENV_DIR}/postgres.env" ]] || die "Missing ${TM_ENV_DIR}/postgres.env — run configure first."

  # shellcheck disable=SC1090
  set -a
  # shellcheck source=/dev/null
  source "${TM_ENV_DIR}/postgres.env"
  set +a

  log "Starting Postgres on 127.0.0.1:5433"
  docker compose --env-file "${TM_ENV_DIR}/postgres.env" -f "$compose" up -d

  # Align cms.env DATABASE_URL password if still placeholder
  if [[ -f "${TM_ENV_DIR}/cms.env" ]] && grep -q 'CHANGE_ME_STRONG_PASSWORD' "${TM_ENV_DIR}/cms.env" 2>/dev/null; then
    local pw="${POSTGRES_PASSWORD}"
    sed -i "s|CHANGE_ME_STRONG_PASSWORD|${pw}|g" "${TM_ENV_DIR}/cms.env"
    log "Updated DATABASE_URL password in cms.env from postgres.env"
  fi

  log "Waiting for Postgres health..."
  for _ in $(seq 1 30); do
    if docker compose --env-file "${TM_ENV_DIR}/postgres.env" -f "$compose" exec -T postgres \
      pg_isready -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-tienda_magico_cms}" >/dev/null 2>&1; then
      log "Postgres is ready"
      return 0
    fi
    sleep 1
  done
  die "Postgres did not become ready in time"
}

ensure_code() {
  if [[ -f "${TM_APP_DIR}/package.json" ]]; then
    log "App code present at ${TM_APP_DIR}"
    if [[ -d "${TM_APP_DIR}/.git" ]]; then
      log "Pulling ${TM_BRANCH}..."
      sudo -u "${TM_APP_USER}" git -C "${TM_APP_DIR}" fetch --prune origin
      sudo -u "${TM_APP_USER}" git -C "${TM_APP_DIR}" checkout "${TM_BRANCH}"
      sudo -u "${TM_APP_USER}" git -C "${TM_APP_DIR}" pull --ff-only origin "${TM_BRANCH}" || \
        warn "git pull failed (dirty tree or no remote?) — continuing with local tree"
    fi
    return
  fi

  if [[ -n "${TM_GIT_URL}" ]]; then
    log "Cloning ${TM_GIT_URL} → ${TM_APP_DIR}"
    rm -rf "${TM_APP_DIR}"
    sudo -u "${TM_APP_USER}" git clone --branch "${TM_BRANCH}" "${TM_GIT_URL}" "${TM_APP_DIR}"
    return
  fi

  # If we're executing from a checkout that isn't the app dir, rsync it
  if [[ -f "${REPO_ROOT}/package.json" && "${REPO_ROOT}" != "${TM_APP_DIR}" ]]; then
    log "Syncing checkout ${REPO_ROOT} → ${TM_APP_DIR}"
    mkdir -p "${TM_APP_DIR}"
    rsync -a --delete \
      --exclude '.git' \
      --exclude 'node_modules' \
      --exclude 'apps/cms/node_modules' \
      --exclude '.next' \
      --exclude 'apps/cms/.next' \
      --exclude '.env' \
      --exclude '.env.*' \
      --exclude 'apps/cms/.env' \
      --exclude 'apps/cms/media/*' \
      --exclude '**/*.tsbuildinfo' \
      "${REPO_ROOT}/" "${TM_APP_DIR}/"
    # keep media dir
    mkdir -p "${TM_APP_DIR}/apps/cms/media"
    chown -R "${TM_APP_USER}:${TM_APP_USER}" "${TM_APP_DIR}"
    return
  fi

  die "No application code at ${TM_APP_DIR}. Pass --git-url or sync the repo first."
}

run_as_app() {
  sudo -u "${TM_APP_USER}" -H bash -lc "$*"
}

cmd_deploy() {
  require_root
  need_cmd node
  need_cmd npm

  ensure_app_user
  ensure_code
  sync_cms_dotenv

  # Ensure media directory is writable
  mkdir -p "${TM_APP_DIR}/apps/cms/media"
  chown -R "${TM_APP_USER}:${TM_APP_USER}" "${TM_APP_DIR}"

  if [[ "${TM_SKIP_BUILD}" != "1" ]]; then
    log "Installing storefront dependencies"
    run_as_app "cd '${TM_APP_DIR}' && npm ci"

    log "Installing CMS dependencies"
    run_as_app "cd '${TM_APP_DIR}/apps/cms' && npm ci"

    log "Building CMS"
    run_as_app "cd '${TM_APP_DIR}/apps/cms' && npm run build"

    log "Building storefront"
    run_as_app "cd '${TM_APP_DIR}' && npm run build:web"
  else
    log "Skipping install/build (--skip-build)"
  fi

  # Re-sync env after build (Next inlines some NEXT_PUBLIC_* at build time —
  # rebuild if you change those values).
  sync_cms_dotenv

  log "Restarting services"
  systemctl restart tienda-magico-cms.service
  # Give CMS a moment before storefront starts hitting it
  sleep 2
  systemctl restart tienda-magico-web.service

  sleep 2
  cmd_status || warn "Health checks reported issues — inspect journalctl"
  log "Deploy finished."
}

cmd_restart() {
  require_root
  systemctl restart tienda-magico-cms.service tienda-magico-web.service
  systemctl --no-pager --full status tienda-magico-cms.service tienda-magico-web.service || true
}

cmd_status() {
  local ok=0
  echo "--- systemd ---"
  systemctl is-active tienda-magico-cms.service 2>/dev/null || true
  systemctl is-active tienda-magico-web.service 2>/dev/null || true
  systemctl is-active nginx 2>/dev/null || true
  systemctl is-active docker 2>/dev/null || true

  echo "--- local HTTP ---"
  if curl -fsS -o /dev/null -w "cms  :4000 → %{http_code}\n" --max-time 5 http://127.0.0.1:4000/admin || echo "cms  :4000 → down"; then
    :
  else
    ok=1
  fi
  if curl -fsS -o /dev/null -w "web  :3000 → %{http_code}\n" --max-time 5 http://127.0.0.1:3000/ || echo "web  :3000 → down"; then
    :
  else
    ok=1
  fi
  if curl -fsS -o /dev/null -w "api checkout → %{http_code}\n" --max-time 5 http://127.0.0.1:3000/api/checkout || echo "api checkout → down"; then
    :
  else
    ok=1
  fi

  echo "--- docker postgres ---"
  docker ps --filter name=postgres --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null || true

  return "$ok"
}

cmd_logs() {
  local which="${REMOTE_ARGS[0]:-all}"
  case "$which" in
    web) journalctl -u tienda-magico-web.service -f -n 100 ;;
    cms) journalctl -u tienda-magico-cms.service -f -n 100 ;;
    all|*) journalctl -u tienda-magico-web.service -u tienda-magico-cms.service -f -n 100 ;;
  esac
}

cmd_remote() {
  need_cmd gcloud
  local sub="${REMOTE_ARGS[0]:-}"
  [[ -n "$sub" ]] || die "remote requires a subcommand, e.g. remote deploy"
  shift_remote_once

  [[ -n "$GCP_INSTANCE" ]] || die "Set --instance (GCE VM name)"
  [[ -n "$GCP_ZONE" ]] || die "Set --zone"
  # project optional if gcloud default is set

  local gcloud_args=(compute ssh "$GCP_INSTANCE" --zone="$GCP_ZONE")
  if [[ -n "$GCP_PROJECT" ]]; then
    gcloud_args+=(--project="$GCP_PROJECT")
  fi

  case "$sub" in
    bootstrap|configure|db-up|deploy|restart|status)
      log "Running '$sub' on ${GCP_INSTANCE} (${GCP_ZONE})"
      # Ensure latest deploy scripts are on the VM when using git remote path is hard;
      # prefer: rsync deploy folder then run.
      local remote_tmp="/tmp/tm-deploy-gce"
      gcloud "${gcloud_args[@]}" --command="sudo mkdir -p ${remote_tmp} && sudo chown \$(whoami) ${remote_tmp}" 
      gcloud compute scp --recurse \
        ${GCP_PROJECT:+--project="$GCP_PROJECT"} \
        --zone="$GCP_ZONE" \
        "${SCRIPT_DIR}" \
        "${GCP_INSTANCE}:${remote_tmp}/"
      # shellcheck disable=SC2029
      gcloud "${gcloud_args[@]}" --command="sudo bash ${remote_tmp}/gce/deploy.sh ${sub} --app-dir '${TM_APP_DIR}' --env-dir '${TM_ENV_DIR}' --shop-host '${TM_SHOP_HOST}' --cms-host '${TM_CMS_HOST}' --branch '${TM_BRANCH}' ${TM_GIT_URL:+--git-url '${TM_GIT_URL}'} ${TM_SKIP_BUILD:+$([[ "$TM_SKIP_BUILD" == 1 ]] && echo --skip-build)}"
      ;;
    ssh)
      gcloud "${gcloud_args[@]}"
      ;;
    sync-code)
      need_cmd gcloud
      log "Rsync project to VM:${TM_APP_DIR} (via /tmp then sudo)"
      local stamp
      stamp="$(date +%Y%m%d%H%M%S)"
      local remote_bundle="/tmp/tm-app-${stamp}.tgz"
      tar -C "${REPO_ROOT}" \
        --exclude='./node_modules' \
        --exclude='./apps/cms/node_modules' \
        --exclude='./.next' \
        --exclude='./apps/cms/.next' \
        --exclude='./.git' \
        --exclude='./apps/cms/media/*' \
        --exclude='./**/*.tsbuildinfo' \
        -czf "/tmp/tm-app-local-${stamp}.tgz" .
      gcloud compute scp \
        ${GCP_PROJECT:+--project="$GCP_PROJECT"} \
        --zone="$GCP_ZONE" \
        "/tmp/tm-app-local-${stamp}.tgz" \
        "${GCP_INSTANCE}:${remote_bundle}"
      gcloud "${gcloud_args[@]}" --command="sudo mkdir -p '${TM_APP_DIR}' && sudo tar -xzf '${remote_bundle}' -C '${TM_APP_DIR}' && sudo chown -R '${TM_APP_USER}:${TM_APP_USER}' '${TM_APP_DIR}' && rm -f '${remote_bundle}'"
      rm -f "/tmp/tm-app-local-${stamp}.tgz"
      log "Code synced. Run: $0 remote deploy --instance ... --zone ..."
      ;;
    *)
      die "Unknown remote subcommand: $sub (bootstrap|configure|db-up|deploy|restart|status|ssh|sync-code)"
      ;;
  esac
}

shift_remote_once() {
  # REMOTE_ARGS[0] was the subcommand
  local rest=("${REMOTE_ARGS[@]:1}")
  REMOTE_ARGS=("${rest[@]}")
}

main() {
  parse_args "$@"

  case "$COMMAND" in
    -h|--help|help) usage ;;
    bootstrap) cmd_bootstrap ;;
    configure) cmd_configure ;;
    db-up) cmd_db_up ;;
    deploy) cmd_deploy ;;
    restart) cmd_restart ;;
    status) cmd_status ;;
    logs) cmd_logs ;;
    remote) cmd_remote ;;
    *) die "Unknown command: $COMMAND (see --help)" ;;
  esac
}

main "$@"
