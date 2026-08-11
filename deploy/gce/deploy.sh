#!/usr/bin/env bash
# Pueblo Mágico — deploy storefront and/or Payload CMS on Google Cloud VM(s).
#
# Roles (same script, one VM or two):
#   all  — storefront + CMS + Postgres on one VM (default)
#   cms  — CMS + Postgres only (backend VM)
#   web  — storefront only (frontend VM)
#
# Examples:
#   sudo ./deploy/gce/deploy.sh bootstrap --role cms
#   sudo ./deploy/gce/deploy.sh configure --role cms --cms-host cms.example.com --shop-host shop.example.com
#   sudo ./deploy/gce/deploy.sh db-up --role cms
#   sudo ./deploy/gce/deploy.sh deploy --role cms
#
#   sudo ./deploy/gce/deploy.sh bootstrap --role web
#   sudo ./deploy/gce/deploy.sh configure --role web --shop-host shop.example.com --cms-host cms.example.com
#   sudo ./deploy/gce/deploy.sh deploy --role web
#
#   ./deploy/gce/deploy.sh remote deploy --role cms --project my-gcp --zone us-central1-a --instance tm-cms
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
# all | cms | web — empty means "not set on CLI"; may load from $TM_ENV_DIR/role
TM_ROLE="${TM_ROLE:-}"
TM_ROLE_EXPLICIT=0
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
  bootstrap     Install OS packages for the selected role (once per VM)
  configure     Install systemd units, nginx site(s), env templates for role
  db-up         Start Postgres (Docker) — cms|all only
  deploy        Sync/pull code, npm ci, build, restart role services
  restart       Restart role systemd units
  status        Show service / HTTP health for this role
  logs [web|cms|all]   Follow journald logs
  remote <cmd>  Run a command on a GCE VM via gcloud compute ssh

Roles (--role):
  all   Storefront + CMS + Postgres on one VM (default)
  cms   Backend VM: Payload CMS + Postgres + cms nginx vhost
  web   Frontend VM: Next.js storefront + shop nginx vhost

Options:
  --role ROLE           all|cms|web (default: all, or value in $TM_ENV_DIR/role)
  --app-dir DIR         App path (default: /opt/tienda-magico)
  --env-dir DIR         Env path (default: /etc/tienda-magico)
  --shop-host HOST      Storefront public hostname
  --cms-host HOST       CMS public hostname
  --branch NAME         Git branch for pull deploys (default: main)
  --git-url URL         Clone URL if app dir is empty
  --skip-build          Restart only (no npm ci / build)
  --skip-nginx          Do not touch nginx during configure
  --project ID          GCP project (remote)
  --zone ZONE           GCP zone (remote)
  --instance NAME       GCE instance name (remote)
  -h, --help            Show help

Environment files under /etc/tienda-magico (seeded by configure, mode 640):
  role              persisted deploy role (all|cms|web)
  storefront.env    web|all
  cms.env           cms|all
  postgres.env      cms|all (also auto-created by db-up)

See docs/deploy/gce.md for full instructions (same-VM and split-VM).
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
      --role)
        TM_ROLE="${2:-}"
        TM_ROLE_EXPLICIT=1
        shift 2
        ;;
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

normalize_role() {
  case "${1:-}" in
    all|cms|web) printf '%s' "$1" ;;
    backend|cms-only) printf 'cms' ;;
    frontend|storefront|web-only) printf 'web' ;;
    *) return 1 ;;
  esac
}

load_persisted_role() {
  local f="${TM_ENV_DIR}/role"
  if [[ -f "$f" ]]; then
    tr -d '[:space:]' <"$f"
  fi
}

persist_role() {
  mkdir -p "${TM_ENV_DIR}"
  printf '%s\n' "${TM_ROLE}" > "${TM_ENV_DIR}/role"
  chmod 644 "${TM_ENV_DIR}/role"
  log "Persisted role '${TM_ROLE}' → ${TM_ENV_DIR}/role"
}

resolve_role() {
  local candidate="${TM_ROLE}"
  if [[ "${TM_ROLE_EXPLICIT}" != "1" || -z "$candidate" ]]; then
    local persisted
    persisted="$(load_persisted_role || true)"
    if [[ -n "$persisted" ]]; then
      if [[ -z "$candidate" ]]; then
        candidate="$persisted"
      elif [[ "$candidate" != "$persisted" && "${TM_ROLE_EXPLICIT}" != "1" ]]; then
        candidate="$persisted"
      fi
    fi
  fi
  if [[ -z "$candidate" ]]; then
    candidate="all"
  fi
  TM_ROLE="$(normalize_role "$candidate")" || die "Invalid --role '${candidate}' (use all|cms|web)"
}

role_wants_cms() { [[ "${TM_ROLE}" == "all" || "${TM_ROLE}" == "cms" ]]; }
role_wants_web() { [[ "${TM_ROLE}" == "all" || "${TM_ROLE}" == "web" ]]; }

require_cms_role() {
  role_wants_cms || die "Command requires --role cms|all (this VM role is '${TM_ROLE}')."
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
  resolve_role
  persist_role
  log "Bootstrapping GCE VM for Pueblo Mágico (role=${TM_ROLE})"

  local pm
  pm="$(detect_pkg_manager)"
  if [[ "$pm" == apt ]]; then
    apt-get update -y
    apt-get install -y ca-certificates curl gnupg git rsync jq ufw build-essential python3 openssl
  else
    dnf install -y ca-certificates curl git rsync jq firewalld gcc-c++ make python3 openssl
  fi

  ensure_app_user
  install_node
  if role_wants_cms; then
    install_docker
  else
    log "Skipping Docker install (role=${TM_ROLE} does not run Postgres/CMS on this VM)"
  fi
  install_nginx

  if command -v ufw >/dev/null 2>&1; then
    ufw allow OpenSSH || true
    ufw allow 80/tcp || true
    ufw allow 443/tcp || true
    ufw --force enable || true
  fi

  log "Bootstrap complete (role=${TM_ROLE})."
  log "Next: put code in ${TM_APP_DIR}, then:"
  case "${TM_ROLE}" in
    cms)
      log "  sudo $0 configure --role cms --cms-host YOUR_CMS_HOST --shop-host YOUR_SHOP_HOST"
      log "  # edit ${TM_ENV_DIR}/cms.env (CORS_ORIGINS must include the shop origin)"
      log "  sudo $0 db-up && sudo $0 deploy"
      ;;
    web)
      log "  sudo $0 configure --role web --shop-host YOUR_SHOP_HOST --cms-host YOUR_CMS_HOST"
      log "  # edit ${TM_ENV_DIR}/storefront.env (PAYLOAD_ECOMMERCE_URL → public CMS URL)"
      log "  sudo $0 deploy"
      ;;
    *)
      log "  sudo $0 configure --shop-host YOUR_SHOP_HOST --cms-host YOUR_CMS_HOST"
      log "  # edit ${TM_ENV_DIR}/storefront.env and cms.env"
      log "  sudo $0 db-up && sudo $0 deploy"
      ;;
  esac
}

render_nginx_file() {
  local src="$1"
  local dest_name="$2"
  local dest="/etc/nginx/sites-available/${dest_name}"
  local enabled="/etc/nginx/sites-enabled/${dest_name}"

  [[ -f "$src" ]] || die "Missing nginx template: $src"

  sed \
    -e "s/shop\\.example\\.com/${TM_SHOP_HOST//\//\\/}/g" \
    -e "s/cms\\.example\\.com/${TM_CMS_HOST//\//\\/}/g" \
    "$src" > "$dest"
  ln -sfn "$dest" "$enabled"
  log "nginx site ${dest_name} → server_name(s) for role"
}

disable_nginx_site() {
  local name="$1"
  rm -f "/etc/nginx/sites-enabled/${name}"
}

render_nginx() {
  mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
  rm -f /etc/nginx/sites-enabled/default

  # Prefer split configs; fall back to combined legacy file for all.
  local web_src="${SCRIPT_DIR}/nginx/storefront.conf"
  local cms_src="${SCRIPT_DIR}/nginx/cms.conf"
  local combined_src="${SCRIPT_DIR}/nginx/tienda-magico.conf"

  if role_wants_web && role_wants_cms; then
    if [[ -f "$web_src" && -f "$cms_src" ]]; then
      render_nginx_file "$web_src" "tienda-magico-web.conf"
      render_nginx_file "$cms_src" "tienda-magico-cms.conf"
      disable_nginx_site "tienda-magico.conf"
    else
      render_nginx_file "$combined_src" "tienda-magico.conf"
      disable_nginx_site "tienda-magico-web.conf"
      disable_nginx_site "tienda-magico-cms.conf"
    fi
  elif role_wants_web; then
    render_nginx_file "$web_src" "tienda-magico-web.conf"
    disable_nginx_site "tienda-magico-cms.conf"
    disable_nginx_site "tienda-magico.conf"
  elif role_wants_cms; then
    render_nginx_file "$cms_src" "tienda-magico-cms.conf"
    disable_nginx_site "tienda-magico-web.conf"
    disable_nginx_site "tienda-magico.conf"
  fi

  nginx -t
  systemctl reload nginx
  log "nginx configured (role=${TM_ROLE}, shop=${TM_SHOP_HOST}, cms=${TM_CMS_HOST})"
}

install_unit_from_template() {
  local src="$1"
  local dest="$2"
  sed "s|/opt/tienda-magico|${TM_APP_DIR}|g; s|User=tienda|User=${TM_APP_USER}|g; s|Group=tienda|Group=${TM_APP_USER}|g; s|/etc/tienda-magico|${TM_ENV_DIR}|g" \
    "$src" > "$dest"
}

install_systemd_units() {
  local unit_dir="${SCRIPT_DIR}/systemd"
  local enable_units=()
  local disable_units=()

  if role_wants_web; then
    install_unit_from_template \
      "${unit_dir}/tienda-magico-web.service" \
      /etc/systemd/system/tienda-magico-web.service
    enable_units+=(tienda-magico-web.service)
  else
    disable_units+=(tienda-magico-web.service)
  fi

  if role_wants_cms; then
    install_unit_from_template \
      "${unit_dir}/tienda-magico-cms.service" \
      /etc/systemd/system/tienda-magico-cms.service
    enable_units+=(tienda-magico-cms.service)
  else
    disable_units+=(tienda-magico-cms.service)
  fi

  systemctl daemon-reload

  if ((${#enable_units[@]})); then
    systemctl enable "${enable_units[@]}"
    log "Enabled systemd units: ${enable_units[*]}"
  fi

  local u
  for u in "${disable_units[@]}"; do
    if systemctl cat "$u" &>/dev/null; then
      systemctl disable --now "$u" 2>/dev/null || systemctl disable "$u" 2>/dev/null || true
      log "Disabled systemd unit (not used for role=${TM_ROLE}): $u"
    fi
  done
}

gen_secret() {
  local len="${1:-32}"
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -base64 48 | tr -d '/+=\n' | head -c "${len}"
  else
    tr -dc 'A-Za-z0-9' </dev/urandom | head -c "${len}"
  fi
}

ensure_postgres_env() {
  mkdir -p "${TM_ENV_DIR}"
  if [[ -f "${TM_ENV_DIR}/postgres.env" ]]; then
    return 0
  fi

  local pw
  pw="$(gen_secret 32)"
  [[ -n "$pw" ]] || die "Failed to generate Postgres password"

  if [[ -f "${SCRIPT_DIR}/env/postgres.env.example" ]]; then
    sed \
      -e "s|CHANGE_ME_POSTGRES_PASSWORD|${pw}|g" \
      "${SCRIPT_DIR}/env/postgres.env.example" > "${TM_ENV_DIR}/postgres.env"
  else
    cat > "${TM_ENV_DIR}/postgres.env" <<EOF
POSTGRES_USER=postgres
POSTGRES_PASSWORD=${pw}
POSTGRES_DB=tienda_magico_cms
EOF
  fi
  chmod 600 "${TM_ENV_DIR}/postgres.env"
  log "Created ${TM_ENV_DIR}/postgres.env with generated password"
}

lock_env_dir_perms() {
  chown root:root "${TM_ENV_DIR}" 2>/dev/null || true
  chmod 755 "${TM_ENV_DIR}"
  if id "${TM_APP_USER}" &>/dev/null; then
    chown root:"${TM_APP_USER}" "${TM_ENV_DIR}"/*.env 2>/dev/null || true
  else
    chown root:root "${TM_ENV_DIR}"/*.env 2>/dev/null || true
  fi
  chmod 640 "${TM_ENV_DIR}"/*.env 2>/dev/null || true
  # role file is non-secret
  if [[ -f "${TM_ENV_DIR}/role" ]]; then
    chown root:root "${TM_ENV_DIR}/role" 2>/dev/null || true
    chmod 644 "${TM_ENV_DIR}/role"
  fi
}

seed_env_files() {
  mkdir -p "${TM_ENV_DIR}"

  if role_wants_web; then
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
  fi

  if role_wants_cms; then
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
    ensure_postgres_env
  fi

  lock_env_dir_perms
}

sync_role_dotenv() {
  if role_wants_cms; then
    local cms_env="${TM_ENV_DIR}/cms.env"
    local dest="${TM_APP_DIR}/apps/cms/.env"
    if [[ -f "$cms_env" ]]; then
      mkdir -p "$(dirname "$dest")"
      install -o "${TM_APP_USER}" -g "${TM_APP_USER}" -m 600 "$cms_env" "$dest"
      log "Synced CMS env → ${dest}"
    fi
  fi

  if role_wants_web; then
    local web_env="${TM_ENV_DIR}/storefront.env"
    local web_dest="${TM_APP_DIR}/.env.production.local"
    if [[ -f "$web_env" ]]; then
      install -o "${TM_APP_USER}" -g "${TM_APP_USER}" -m 600 "$web_env" "$web_dest"
      install -o "${TM_APP_USER}" -g "${TM_APP_USER}" -m 600 "$web_env" "${TM_APP_DIR}/.env.local"
      log "Synced storefront env → ${web_dest}"
    fi
  fi
}

prefer_app_tree_assets() {
  if [[ -d "${TM_APP_DIR}/deploy/gce/systemd" ]]; then
    SCRIPT_DIR="${TM_APP_DIR}/deploy/gce"
  fi
}

cmd_configure() {
  require_root
  resolve_role
  [[ -d "${SCRIPT_DIR}/systemd" ]] || die "Missing deploy assets; run from a full checkout."
  prefer_app_tree_assets

  persist_role
  seed_env_files
  install_systemd_units
  if [[ "${TM_SKIP_NGINX}" != "1" ]]; then
    render_nginx
  fi
  log "Configure done (role=${TM_ROLE}). Edit env files under ${TM_ENV_DIR} before deploy."
  if role_wants_cms && role_wants_web; then
    log "  ${TM_ENV_DIR}/cms.env  ${TM_ENV_DIR}/storefront.env  ${TM_ENV_DIR}/postgres.env"
  elif role_wants_cms; then
    log "  ${TM_ENV_DIR}/cms.env  ${TM_ENV_DIR}/postgres.env"
    log "  Ensure CORS_ORIGINS includes https://${TM_SHOP_HOST}"
  else
    log "  ${TM_ENV_DIR}/storefront.env"
    log "  Ensure PAYLOAD_ECOMMERCE_URL points at https://${TM_CMS_HOST}"
  fi
}

align_cms_database_url() {
  local cms_env="${TM_ENV_DIR}/cms.env"
  local pw="${POSTGRES_PASSWORD:-}"
  [[ -n "$pw" && -f "$cms_env" ]] || return 0

  if grep -q 'CHANGE_ME_STRONG_PASSWORD' "$cms_env" 2>/dev/null; then
    sed -i "s|CHANGE_ME_STRONG_PASSWORD|${pw}|g" "$cms_env"
    log "Updated DATABASE_URL password in cms.env from postgres.env"
  fi
}

cmd_db_up() {
  resolve_role
  require_cms_role
  require_root
  need_cmd docker

  prefer_app_tree_assets
  local compose="${SCRIPT_DIR}/docker-compose.postgres.yml"
  if [[ -f "${TM_APP_DIR}/deploy/gce/docker-compose.postgres.yml" ]]; then
    compose="${TM_APP_DIR}/deploy/gce/docker-compose.postgres.yml"
  fi
  [[ -f "$compose" ]] || die "Missing compose file: ${compose} (is the repo checked out?)"

  if [[ ! -f "${TM_ENV_DIR}/postgres.env" ]]; then
    warn "Missing ${TM_ENV_DIR}/postgres.env — creating it now (prefer: sudo $0 configure --role ${TM_ROLE} first)."
    if [[ -f "${TM_APP_DIR}/deploy/gce/env/postgres.env.example" ]]; then
      SCRIPT_DIR="${TM_APP_DIR}/deploy/gce"
    fi
    ensure_postgres_env
    lock_env_dir_perms
  fi

  # shellcheck disable=SC1090
  set -a
  # shellcheck source=/dev/null
  source "${TM_ENV_DIR}/postgres.env"
  set +a

  [[ -n "${POSTGRES_PASSWORD:-}" ]] || die "${TM_ENV_DIR}/postgres.env must set POSTGRES_PASSWORD"

  log "Starting Postgres on 127.0.0.1:5433 (role=${TM_ROLE})"
  docker compose --env-file "${TM_ENV_DIR}/postgres.env" -f "$compose" up -d

  align_cms_database_url

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
  resolve_role
  need_cmd node
  need_cmd npm

  ensure_app_user
  ensure_code
  sync_role_dotenv

  if role_wants_cms; then
    mkdir -p "${TM_APP_DIR}/apps/cms/media"
  fi
  chown -R "${TM_APP_USER}:${TM_APP_USER}" "${TM_APP_DIR}"

  if [[ "${TM_SKIP_BUILD}" != "1" ]]; then
    if role_wants_web; then
      log "Installing storefront dependencies"
      run_as_app "cd '${TM_APP_DIR}' && npm ci"
    fi

    if role_wants_cms; then
      log "Installing CMS dependencies"
      run_as_app "cd '${TM_APP_DIR}/apps/cms' && npm ci"
      log "Building CMS"
      run_as_app "cd '${TM_APP_DIR}/apps/cms' && npm run build"
    fi

    if role_wants_web; then
      log "Building storefront"
      run_as_app "cd '${TM_APP_DIR}' && npm run build:web"
    fi
  else
    log "Skipping install/build (--skip-build)"
  fi

  # Re-sync env after build (NEXT_PUBLIC_* are inlined at build time).
  sync_role_dotenv

  log "Restarting services (role=${TM_ROLE})"
  if role_wants_cms; then
    systemctl restart tienda-magico-cms.service
    sleep 2
  fi
  if role_wants_web; then
    systemctl restart tienda-magico-web.service
  fi

  sleep 2
  cmd_status || warn "Health checks reported issues — inspect journalctl"
  log "Deploy finished (role=${TM_ROLE})."
}

cmd_restart() {
  require_root
  resolve_role
  local units=()
  role_wants_cms && units+=(tienda-magico-cms.service)
  role_wants_web && units+=(tienda-magico-web.service)
  ((${#units[@]})) || die "No units for role=${TM_ROLE}"
  systemctl restart "${units[@]}"
  systemctl --no-pager --full status "${units[@]}" || true
}

cmd_status() {
  resolve_role
  local ok=0
  echo "--- role: ${TM_ROLE} ---"
  echo "--- systemd ---"
  if role_wants_cms; then
    systemctl is-active tienda-magico-cms.service 2>/dev/null || true
  fi
  if role_wants_web; then
    systemctl is-active tienda-magico-web.service 2>/dev/null || true
  fi
  systemctl is-active nginx 2>/dev/null || true
  if role_wants_cms; then
    systemctl is-active docker 2>/dev/null || true
  fi

  echo "--- local HTTP ---"
  if role_wants_cms; then
    if ! curl -fsS -o /dev/null -w "cms  :4000 → %{http_code}\n" --max-time 5 http://127.0.0.1:4000/admin; then
      echo "cms  :4000 → down"
      ok=1
    fi
  fi
  if role_wants_web; then
    if ! curl -fsS -o /dev/null -w "web  :3000 → %{http_code}\n" --max-time 5 http://127.0.0.1:3000/; then
      echo "web  :3000 → down"
      ok=1
    fi
    if ! curl -fsS -o /dev/null -w "api checkout → %{http_code}\n" --max-time 5 http://127.0.0.1:3000/api/checkout; then
      echo "api checkout → down"
      ok=1
    fi
  fi

  if role_wants_cms; then
    echo "--- docker postgres ---"
    docker ps --filter name=postgres --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null || true
  fi

  return "$ok"
}

cmd_logs() {
  resolve_role
  local which="${REMOTE_ARGS[0]:-}"
  if [[ -z "$which" ]]; then
    case "${TM_ROLE}" in
      cms) which=cms ;;
      web) which=web ;;
      *) which=all ;;
    esac
  fi
  case "$which" in
    web) journalctl -u tienda-magico-web.service -f -n 100 ;;
    cms) journalctl -u tienda-magico-cms.service -f -n 100 ;;
    all|*) journalctl -u tienda-magico-web.service -u tienda-magico-cms.service -f -n 100 ;;
  esac
}

remote_flags() {
  # Flags forwarded to the on-VM deploy.sh invocation
  local flags=(
    --app-dir "${TM_APP_DIR}"
    --env-dir "${TM_ENV_DIR}"
    --shop-host "${TM_SHOP_HOST}"
    --cms-host "${TM_CMS_HOST}"
    --branch "${TM_BRANCH}"
    --role "${TM_ROLE}"
  )
  [[ -n "${TM_GIT_URL}" ]] && flags+=(--git-url "${TM_GIT_URL}")
  [[ "${TM_SKIP_BUILD}" == "1" ]] && flags+=(--skip-build)
  [[ "${TM_SKIP_NGINX}" == "1" ]] && flags+=(--skip-nginx)
  printf '%q ' "${flags[@]}"
}

cmd_remote() {
  need_cmd gcloud
  local sub="${REMOTE_ARGS[0]:-}"
  [[ -n "$sub" ]] || die "remote requires a subcommand, e.g. remote deploy"
  shift_remote_once

  [[ -n "$GCP_INSTANCE" ]] || die "Set --instance (GCE VM name)"
  [[ -n "$GCP_ZONE" ]] || die "Set --zone"
  resolve_role

  local gcloud_args=(compute ssh "$GCP_INSTANCE" --zone="$GCP_ZONE")
  if [[ -n "$GCP_PROJECT" ]]; then
    gcloud_args+=(--project="$GCP_PROJECT")
  fi

  case "$sub" in
    bootstrap|configure|db-up|deploy|restart|status)
      log "Running '$sub' on ${GCP_INSTANCE} (${GCP_ZONE}) role=${TM_ROLE}"
      local remote_tmp="/tmp/tm-deploy-gce"
      gcloud "${gcloud_args[@]}" --command="sudo mkdir -p ${remote_tmp} && sudo chown \$(whoami) ${remote_tmp}"
      gcloud compute scp --recurse \
        ${GCP_PROJECT:+--project="$GCP_PROJECT"} \
        --zone="$GCP_ZONE" \
        "${SCRIPT_DIR}" \
        "${GCP_INSTANCE}:${remote_tmp}/"
      local fwd
      fwd="$(remote_flags)"
      # shellcheck disable=SC2029
      gcloud "${gcloud_args[@]}" --command="sudo bash ${remote_tmp}/gce/deploy.sh ${sub} ${fwd}"
      ;;
    ssh)
      gcloud "${gcloud_args[@]}"
      ;;
    sync-code)
      need_cmd gcloud
      log "Rsync project to ${GCP_INSTANCE}:${TM_APP_DIR} (via /tmp then sudo)"
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
      log "Code synced. Run: $0 remote deploy --role ${TM_ROLE} --instance ... --zone ..."
      ;;
    *)
      die "Unknown remote subcommand: $sub (bootstrap|configure|db-up|deploy|restart|status|ssh|sync-code)"
      ;;
  esac
}

shift_remote_once() {
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
