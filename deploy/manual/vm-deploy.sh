#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${TM_APP_DIR:-/opt/tienda-magico}"
DATA_DIR="${TM_DATA_DIR:-/var/lib/tienda-magico}"
DEPLOY_ENV="$APP_DIR/deployment.env"
COMPOSE_FILE="$APP_DIR/compose.yml"

log() { printf '==> %s\n' "$*"; }
die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
need_root() { [[ "${EUID:-$(id -u)}" -eq 0 ]] || die 'Run this command with sudo.'; }

usage() {
  cat <<'EOF'
Usage:
  sudo ./vm-deploy.sh install
  sudo ./vm-deploy.sh activate --artifact /tmp/images.tar --tag RELEASE_TAG
  sudo ./vm-deploy.sh activate --tag PREVIOUS_TAG
  sudo ./vm-deploy.sh status
  sudo ./vm-deploy.sh logs

install   Installs Docker if necessary, refreshes assets, and seeds missing config.
activate  Optionally loads an artifact, then starts the selected immutable tag.
status    Shows container and health status.
logs      Shows the latest application logs.
EOF
}

compose() {
  docker compose --env-file "$DEPLOY_ENV" -f "$COMPOSE_FILE" "$@"
}

install_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    apt-get update
    apt-get install -y ca-certificates curl openssl
    curl -fsSL https://get.docker.com | sh
  fi
  docker compose version >/dev/null
  systemctl enable --now docker
}

seed() {
  local source="$1" target="$2"
  if [[ ! -f "$target" ]]; then
    install -m 600 "$source" "$target"
    log "Created $target; edit it before activation."
  fi
}

install_config() {
  install -d -m 755 "$APP_DIR" "$APP_DIR/env" "$DATA_DIR"
  install -d -m 700 "$DATA_DIR/postgres"
  install -d -m 755 -o 1001 -g 1001 "$DATA_DIR/media"
  install -m 644 "$SCRIPT_DIR/compose.yml" "$COMPOSE_FILE"
  install -m 644 "$SCRIPT_DIR/Caddyfile" "$APP_DIR/Caddyfile"
  seed "$SCRIPT_DIR/env/deployment.env.example" "$DEPLOY_ENV"
  seed "$SCRIPT_DIR/env/storefront.env.example" "$APP_DIR/env/storefront.env"
  seed "$SCRIPT_DIR/env/cms.env.example" "$APP_DIR/env/cms.env"
  seed "$SCRIPT_DIR/env/postgres.env.example" "$APP_DIR/env/postgres.env"
}

validate_file() {
  local file="$1"
  [[ -s "$file" ]] || die "Missing or empty configuration: $file"
  if grep -qiE 'CHANGE_ME|example\.com|replace-me' "$file"; then
    die "Unreplaced placeholder found in $file"
  fi
}

validate_config() {
  validate_file "$DEPLOY_ENV"
  validate_file "$APP_DIR/env/storefront.env"
  validate_file "$APP_DIR/env/cms.env"
  validate_file "$APP_DIR/env/postgres.env"
  grep -qE '^DATABASE_URL=.*@postgres:5432/' "$APP_DIR/env/cms.env" || \
    die 'CMS DATABASE_URL must use the Compose address postgres:5432.'
  grep -qE '^HOSTNAME=0\.0\.0\.0$' "$APP_DIR/env/storefront.env" || \
    die 'storefront.env must contain HOSTNAME=0.0.0.0.'
  grep -qE '^HOSTNAME=0\.0\.0\.0$' "$APP_DIR/env/cms.env" || \
    die 'cms.env must contain HOSTNAME=0.0.0.0.'
}

set_tag() {
  local tag="$1" temporary
  [[ "$tag" =~ ^[A-Za-z0-9._-]+$ ]] || die 'Invalid release tag.'
  temporary="$(mktemp)"
  awk -v tag="$tag" '
    BEGIN { found=0 }
    /^TIENDA_IMAGE_TAG=/ { print "TIENDA_IMAGE_TAG=" tag; found=1; next }
    { print }
    END { if (!found) print "TIENDA_IMAGE_TAG=" tag }
  ' "$DEPLOY_ENV" > "$temporary"
  install -m 600 "$temporary" "$DEPLOY_ENV"
  rm -f "$temporary"
}

cmd_install() {
  need_root
  install_docker
  install_config
  log 'Installation/configuration refresh complete.'
  log "Confirm $APP_DIR/deployment.env and every file under $APP_DIR/env/ are configured."
}

cmd_activate() {
  need_root
  local artifact="" tag=""
  shift
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --artifact) artifact="${2:-}"; shift 2 ;;
      --tag) tag="${2:-}"; shift 2 ;;
      *) die "Unknown activate option: $1" ;;
    esac
  done
  [[ -n "$tag" ]] || die 'activate requires --tag.'
  [[ -f "$COMPOSE_FILE" ]] || die 'Run install first.'
  validate_config
  if [[ -n "$artifact" ]]; then
    [[ -f "$artifact" ]] || die "Artifact not found: $artifact"
    log "Loading images from $artifact..."
    docker load -i "$artifact"
  fi
  docker image inspect "tienda-magico/storefront:$tag" >/dev/null 2>&1 || \
    die "Missing local storefront image for tag $tag."
  docker image inspect "tienda-magico/cms:$tag" >/dev/null 2>&1 || \
    die "Missing local CMS image for tag $tag."
  set_tag "$tag"
  compose config --quiet
  log "Activating $tag..."
  compose up -d --remove-orphans --wait --wait-timeout 180
  compose ps
  log "Release $tag is healthy."
}

cmd_status() {
  need_root
  validate_file "$DEPLOY_ENV"
  compose ps
}

cmd_logs() {
  need_root
  validate_file "$DEPLOY_ENV"
  compose logs --tail=200
}

case "${1:-}" in
  install) cmd_install ;;
  activate) cmd_activate "$@" ;;
  status) cmd_status ;;
  logs) cmd_logs ;;
  *) usage; exit 1 ;;
esac
