#!/usr/bin/env bash
set -euo pipefail

[[ "$EUID" -eq 0 ]] || { echo 'Run as root.' >&2; exit 1; }
[[ $# -eq 2 ]] || { echo 'Usage: tienda-magico-deploy TAG true|false' >&2; exit 1; }

tag="$1"
build_release="$2"
[[ "$tag" =~ ^(staging|production)-[A-Za-z0-9._-]+$ ]] || { echo 'Invalid release tag.' >&2; exit 1; }
[[ "$build_release" == true || "$build_release" == false ]] || { echo 'Invalid build mode.' >&2; exit 1; }

app_dir=/opt/tienda-magico
bundle="/tmp/tienda-manual-${tag}"
runtime_env="/tmp/tienda-storefront-runtime-${tag}.env"
artifact="/tmp/tienda-magico-${tag}.tar"
storefront_env="$app_dir/env/storefront.env"
deployment_env="$app_dir/deployment.env"
compose_file="$app_dir/compose.yml"
caddy_file="$app_dir/Caddyfile"
vm_deploy=/usr/local/lib/tienda-magico/vm-deploy.sh
update_env=/usr/local/lib/tienda-magico/update-runtime-env.sh
environment_file=/etc/tienda-magico/deploy-environment

[[ -f "$environment_file" && ! -L "$environment_file" ]] || { echo 'Deployment environment is not provisioned.' >&2; exit 1; }
expected_environment="$(cat "$environment_file")"
[[ "$expected_environment" == staging || "$expected_environment" == production ]] || { echo 'Invalid deployment environment.' >&2; exit 1; }
[[ "$tag" == "${expected_environment}-"* ]] || { echo 'Release tag belongs to another environment.' >&2; exit 1; }

for file in "$bundle/compose.yml" "$bundle/Caddyfile" "$runtime_env" \
  "$storefront_env" "$deployment_env" "$compose_file" "$caddy_file" \
  "$vm_deploy" "$update_env"; do
  [[ -f "$file" && ! -L "$file" ]] || { echo "Missing or linked deployment file: $file" >&2; exit 1; }
done
[[ -d "$bundle" && ! -L "$bundle" ]] || { echo 'Missing deployment bundle.' >&2; exit 1; }

if [[ "$build_release" == true ]]; then
  for file in "$artifact" "${artifact}.sha256"; do
    [[ -f "$file" && ! -L "$file" ]] || { echo "Missing or linked artifact: $file" >&2; exit 1; }
  done
  read -r expected_digest expected_name < "${artifact}.sha256"
  [[ "$expected_digest" =~ ^[0-9a-fA-F]{64}$ && "$expected_name" == "$(basename "$artifact")" ]] || {
    echo 'Invalid artifact checksum manifest.' >&2
    exit 1
  }
  (cd /tmp && printf '%s  %s\n' "$expected_digest" "$expected_name" | sha256sum --check -)
fi

backup="$(mktemp -d /tmp/tienda-deploy-backup.XXXXXXXX)"
chmod 700 "$backup"
cp -p "$storefront_env" "$backup/storefront.env"
cp -p "$deployment_env" "$backup/deployment.env"
cp -p "$compose_file" "$backup/compose.yml"
cp -p "$caddy_file" "$backup/Caddyfile"

restore_on_failure() {
  status=$?
  trap - EXIT
  if [[ "$status" -ne 0 ]]; then
    echo 'Activation failed; restoring the previous configuration and image tag.' >&2
    cp -p "$backup/storefront.env" "$storefront_env"
    cp -p "$backup/deployment.env" "$deployment_env"
    cp -p "$backup/compose.yml" "$compose_file"
    cp -p "$backup/Caddyfile" "$caddy_file"
    docker compose --env-file "$deployment_env" -f "$compose_file" \
      up -d --remove-orphans --wait --wait-timeout 180 || true
  fi
  rm -rf -- "$backup"
  exit "$status"
}
trap restore_on_failure EXIT

install -m 644 "$bundle/compose.yml" "$compose_file"
install -m 644 "$bundle/Caddyfile" "$caddy_file"
bash "$update_env" "$runtime_env" "$storefront_env"

if [[ "$build_release" == true ]]; then
  bash "$vm_deploy" activate --artifact "$artifact" --tag "$tag"
else
  bash "$vm_deploy" activate --tag "$tag"
fi
bash "$vm_deploy" status
