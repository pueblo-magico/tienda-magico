#!/usr/bin/env bash
set -euo pipefail

die() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

[[ $# -eq 2 ]] || die 'Usage: update-runtime-env.sh MANAGED_ENV TARGET_ENV'

managed_file="$1"
target_file="$2"
[[ -s "$managed_file" ]] || die "Missing or empty managed environment file: $managed_file"
[[ -f "$target_file" ]] || die "Missing target environment file: $target_file"

declare -A seen=()
while IFS= read -r line || [[ -n "$line" ]]; do
  [[ -n "$line" ]] || continue
  [[ "$line" == *=* ]] || die 'Managed environment entries must use KEY=VALUE.'
  key="${line%%=*}"

  case "$key" in
    COMMERCE_PROVIDER|PAYLOAD_ECOMMERCE_URL|PAYLOAD_ECOMMERCE_CURRENCY|PAYLOAD_ECOMMERCE_AMOUNT_IS_CENTS) ;;
    PAYLOAD_CMS_URL|NEXT_PUBLIC_SITE_URL) ;;
    CHECKOUT_PROVIDER|MERCADOPAGO_ACCESS_TOKEN|MERCADOPAGO_SANDBOX|MERCADOPAGO_WEBHOOK_URL) ;;
    *) die "Unsupported managed environment key: $key" ;;
  esac

  [[ -z "${seen[$key]:-}" ]] || die "Duplicate managed environment key: $key"
  seen[$key]=true
done < "$managed_file"

temporary="$(mktemp "${target_file}.XXXXXX")"
trap 'rm -f "$temporary"' EXIT

awk '
  NR == FNR {
    if ($0 == "") next
    separator = index($0, "=")
    key = substr($0, 1, separator - 1)
    replacement[key] = $0
    order[++count] = key
    next
  }
  {
    separator = index($0, "=")
    key = separator > 0 ? substr($0, 1, separator - 1) : ""
    if (key in replacement) {
      if (!(key in written)) print replacement[key]
      written[key] = 1
    } else {
      print
    }
  }
  END {
    for (position = 1; position <= count; position++) {
      key = order[position]
      if (!(key in written)) print replacement[key]
    }
  }
' "$managed_file" "$target_file" > "$temporary"

install -m 600 "$temporary" "$target_file"
