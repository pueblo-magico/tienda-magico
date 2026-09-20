#!/usr/bin/env bash
set -euo pipefail
bundle="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
archive="$1"
tag="$2"
build="$3"
artifact="$4"
app="${TM_APP_DIR:-/opt/tienda-magico}"
temporary="$(mktemp -d)"
trap 'rm -rf -- "$temporary"; rm -f -- "$archive"' EXIT
tar -xf "$archive" -C "$temporary"
for file in deployment.env storefront.env cms.env postgres.env; do
  [[ -s "$temporary/$file" ]] || { echo "Falta configuración: $file"; exit 1; }
done

if [[ -s "${TM_DATA_DIR:-/var/lib/tienda-magico}/postgres/PG_VERSION" ]]; then
  normalize_postgres() {
    sed -e '/^[[:space:]]*#/d' -e '/^[[:space:]]*$/d' -e "s/='\(.*\)'$/=\1/" "$1" | sort
  }
  if ! diff -q <(normalize_postgres "$temporary/postgres.env") <(normalize_postgres "$app/env/postgres.env") >/dev/null; then
    echo "La configuración de PostgreSQL existente difiere. Migrá los valores al Environment sin cambiarlos; la rotación requiere un procedimiento explícito."
    exit 1
  fi
fi

previous=false
if [[ -f "$app/deployment.env" ]]; then
  if docker compose --env-file "$app/deployment.env" -f "$app/compose.yml" ps --status running -q storefront | grep -q .; then
    previous=true
  fi
fi
bash "$bundle/vm-deploy.sh" install
mkdir "$temporary/backup"
cp -p "$app/deployment.env" "$temporary/backup/"
cp -p "$app/env/"{storefront,cms,postgres}.env "$temporary/backup/"

restore() {
  status=$?
  trap - ERR
  set +e
  cp -p "$temporary/backup/deployment.env" "$app/deployment.env"
  cp -p "$temporary/backup/"{storefront,cms,postgres}.env "$app/env/"
  if [[ "$previous" == true ]]; then
    docker compose --env-file "$app/deployment.env" -f "$app/compose.yml" up -d --pull never --remove-orphans --wait --wait-timeout 180
  else
    echo "Primer despliegue fallido: no existe una versión anterior para reactivar."
  fi
  exit "$status"
}
trap restore ERR
install -m 600 "$temporary/deployment.env" "$app/deployment.env"
for file in storefront.env cms.env postgres.env; do
  install -m 600 "$temporary/$file" "$app/env/$file"
done
if [[ "$build" == true ]]; then
  (cd "$(dirname "$artifact")" && sha256sum --check "$(basename "$artifact").sha256")
  bash "$bundle/vm-deploy.sh" activate --artifact "$artifact" --tag "$tag"
else
  bash "$bundle/vm-deploy.sh" activate --tag "$tag"
fi
bash "$bundle/vm-deploy.sh" status
trap - ERR
