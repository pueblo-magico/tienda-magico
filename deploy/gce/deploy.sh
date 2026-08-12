#!/usr/bin/env bash
# Artifact-only release manager for the storefront and Payload CMS.
# This script is copied to the VM during one-time provisioning. It never clones,
# installs npm dependencies, or builds application code on the VM.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TM_ROOT="${TM_ROOT:-/opt/tienda-magico}"
TM_ENV_DIR="${TM_ENV_DIR:-/etc/tienda-magico}"
TM_DATA_DIR="${TM_DATA_DIR:-/var/lib/tienda-magico}"
TM_SHOP_HOST="${TM_SHOP_HOST:-shop.example.com}"
TM_CMS_HOST="${TM_CMS_HOST:-cms.example.com}"
STOREFRONT_IMAGE="${STOREFRONT_IMAGE:-}"
CMS_IMAGE="${CMS_IMAGE:-}"

log() { printf '==> %s\n' "$*"; }
die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
need_root() { [[ "${EUID:-$(id -u)}" -eq 0 ]] || die 'Run this command with sudo.'; }

usage() {
  cat <<'EOF'
Usage: deploy.sh <bootstrap|configure|activate|rollback|status> [options]

Commands:
  bootstrap                 Install Docker, Compose, nginx and firewall rules once.
  configure                 Install the artifact-only Compose and nginx configuration.
  activate --tag SHA        Pull immutable app images and start the release.
  rollback --tag SHA        Activate a previously deployed image tag.
  status                    Show containers and local health checks.

Options:
  --shop-host HOST          Storefront hostname.
  --cms-host HOST           CMS hostname.
  --storefront-image IMAGE  Fully-qualified Artifact Registry storefront image.
  --cms-image IMAGE         Fully-qualified Artifact Registry CMS image.

Runtime configuration lives under /etc/tienda-magico and is supplied by the
GitHub Environment. Application source code is never stored on this VM.
EOF
}

parse() {
  COMMAND="${1:-}"; shift || true
  TAG=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --tag) TAG="${2:-}"; shift 2 ;;
      --shop-host) TM_SHOP_HOST="${2:-}"; shift 2 ;;
      --cms-host) TM_CMS_HOST="${2:-}"; shift 2 ;;
      --storefront-image) STOREFRONT_IMAGE="${2:-}"; shift 2 ;;
      --cms-image) CMS_IMAGE="${2:-}"; shift 2 ;;
      -h|--help) usage; exit 0 ;;
      *) die "Unknown option: $1" ;;
    esac
  done
}

install_packages() {
  apt-get update -y
  apt-get install -y ca-certificates curl gnupg nginx openssl
  if ! command -v docker >/dev/null 2>&1; then
    curl -fsSL https://get.docker.com | sh
  fi
  docker compose version >/dev/null
  systemctl enable --now docker nginx
}

cmd_bootstrap() {
  need_root
  command -v apt-get >/dev/null 2>&1 || die 'This bootstrap currently supports Ubuntu/Debian VMs.'
  install_packages
  mkdir -p "$TM_ROOT" "$TM_ENV_DIR" "$TM_DATA_DIR/postgres" "$TM_DATA_DIR/media"
  chmod 700 "$TM_ENV_DIR"
  log 'VM bootstrap complete. Run configure, then let GitHub Actions activate a release.'
}

seed_file() {
  local source="$1" target="$2"
  [[ -f "$target" ]] && return
  install -m 600 "$source" "$target"
  log "Created template $target; replace its placeholders before deployment."
}

cmd_configure() {
  need_root
  [[ -n "$STOREFRONT_IMAGE" && -n "$CMS_IMAGE" ]] || die '--storefront-image and --cms-image are required.'
  mkdir -p "$TM_ROOT" "$TM_ENV_DIR" "$TM_DATA_DIR/postgres" "$TM_DATA_DIR/media"
  install -m 644 "$SCRIPT_DIR/docker-compose.production.yml" "$TM_ROOT/docker-compose.yml"
  seed_file "$SCRIPT_DIR/env/storefront.env.example" "$TM_ENV_DIR/storefront.env"
  seed_file "$SCRIPT_DIR/env/cms.env.example" "$TM_ENV_DIR/cms.env"
  seed_file "$SCRIPT_DIR/env/deploy.env.example" "$TM_ENV_DIR/deploy.env"
  if [[ ! -f "$TM_ENV_DIR/postgres.env" ]]; then
    umask 077
    printf 'POSTGRES_USER=postgres\nPOSTGRES_PASSWORD=%s\nPOSTGRES_DB=tienda_magico_cms\n' "$(openssl rand -base64 36 | tr -d '/+=')" > "$TM_ENV_DIR/postgres.env"
  fi
  sed -i "s|^STOREFRONT_IMAGE=.*|STOREFRONT_IMAGE=$STOREFRONT_IMAGE|; s|^CMS_IMAGE=.*|CMS_IMAGE=$CMS_IMAGE|" "$TM_ENV_DIR/deploy.env"
  sed -e "s/shop\.example\.com/${TM_SHOP_HOST//\//\\/}/g" -e "s/cms\.example\.com/${TM_CMS_HOST//\//\\/}/g" \
    "$SCRIPT_DIR/nginx/tienda-magico.conf" > /etc/nginx/sites-available/tienda-magico.conf
  ln -sfn /etc/nginx/sites-available/tienda-magico.conf /etc/nginx/sites-enabled/tienda-magico.conf
  rm -f /etc/nginx/sites-enabled/default
  nginx -t && systemctl reload nginx
  log 'Configuration installed. GitHub Actions will replace runtime env files and activate image tags.'
}

compose() { docker compose --env-file "$TM_ENV_DIR/deploy.env" -f "$TM_ROOT/docker-compose.yml" "$@"; }

# Validate environment files for placeholder values that should be replaced before deployment
validate_env_file() {
  local file="$1"
  local name="$2"
  
  if [[ ! -f "$file" ]]; then
    die "Environment file $name not found at: $file"
  fi
  
  # Check for common placeholder values that indicate the file was never properly configured
  local issues=()
  
  # Check for CHANGE_ME placeholders (common in example files)
  if grep -qE 'CHANGE_ME|replace-me' "$file" 2>/dev/null; then
    issues+=("$name contains placeholder values like 'CHANGE_ME' or 'replace-me'")
  fi
  
  # Check for example.com domains that should be replaced with real hostnames
  if grep -qE 'example\.com' "$file" 2>/dev/null; then
    issues+=("$name still contains 'example.com' placeholders")
  fi
  
  if [[ ${#issues[@]} -gt 0 ]]; then
    for issue in "${issues[@]}"; do
      log "WARNING: $issue"
    done
    log "Please configure these environment files before running activate."
    return 1
  fi
  
  return 0
}

cmd_activate() {
  need_root
  [[ -n "$TAG" ]] || die '--tag is required.'
  [[ -f "$TM_ENV_DIR/deploy.env" ]] || die 'Run configure first.'
  [[ "$TAG" =~ ^[a-zA-Z0-9._-]+$ ]] || die 'Invalid image tag.'
  
  # Validate environment files before proceeding
  log 'Validating environment configuration...'
  validate_env_file "$TM_ENV_DIR/deploy.env" "deploy.env" || true  # deploy.env is auto-configured, may have placeholders set by GitHub
  validate_env_file "$TM_ENV_DIR/storefront.env" "storefront.env"
  validate_env_file "$TM_ENV_DIR/cms.env" "cms.env"
  validate_env_file "$TM_ENV_DIR/postgres.env" "postgres.env"
  
  # The VM service account has Artifact Registry Reader. Obtain a short-lived
  # metadata token at deploy time; no registry password is stored on the VM.
  # The registry host is the first segment of the configured image name.
  # shellcheck disable=SC1090
  source "$TM_ENV_DIR/deploy.env"
  local registry="${STOREFRONT_IMAGE%%/*}"
  local access_token
  access_token="$(curl -fsS -H 'Metadata-Flavor: Google' \
    'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token' | \
    sed -n 's/.*"access_token"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')"
  [[ -n "$access_token" ]] || die 'Could not obtain a VM service-account token.'
  printf '%s' "$access_token" | docker login -u oauth2accesstoken --password-stdin "$registry" >/dev/null
  sed -i "s|^TIENDA_IMAGE_TAG=.*|TIENDA_IMAGE_TAG=$TAG|" "$TM_ENV_DIR/deploy.env"
  compose pull
  compose up -d --remove-orphans
  for _ in $(seq 1 30); do
    if curl -fsS --max-time 3 http://127.0.0.1:3000/ >/dev/null && curl -fsS --max-time 3 http://127.0.0.1:4000/admin >/dev/null; then
      log "Release $TAG is healthy."
      return
    fi
    sleep 2
  done
  die "Release $TAG failed health checks; run rollback with the prior tag."
}

cmd_status() {
  compose ps 2>/dev/null || true
  curl -fsS -o /dev/null -w 'storefront: %{http_code}\n' --max-time 5 http://127.0.0.1:3000/ || true
  curl -fsS -o /dev/null -w 'cms: %{http_code}\n' --max-time 5 http://127.0.0.1:4000/admin || true
}

main() {
  parse "$@"
  case "$COMMAND" in
    bootstrap) cmd_bootstrap ;;
    configure) cmd_configure ;;
    activate|rollback) cmd_activate ;;
    status) cmd_status ;;
    *) usage; exit 1 ;;
  esac
}
main "$@"
