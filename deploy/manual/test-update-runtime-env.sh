#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TEMP_DIR"' EXIT

fail() {
  printf 'FAIL: %s\n' "$*" >&2
  exit 1
}

assert_line() {
  local file="$1" expected="$2"
  grep -Fxq "$expected" "$file" || fail "Missing '$expected' in $file"
}

target="$TEMP_DIR/storefront.env"
managed="$TEMP_DIR/managed.env"

cat > "$target" <<'EOF'
NODE_ENV=production
CHECKOUT_PROVIDER=commerce-redirect
MERCADOPAGO_ACCESS_TOKEN=old-token
MERCADOPAGO_WEBHOOK_SECRET=old-test-secret
UNMANAGED_SECRET=keep-me
EOF

cat > "$managed" <<'EOF'
COMMERCE_PROVIDER=payload
PAYLOAD_ECOMMERCE_URL=https://cms.staging.example
PAYLOAD_ECOMMERCE_CURRENCY=ARS
PAYLOAD_ECOMMERCE_AMOUNT_IS_CENTS=true
PAYLOAD_CMS_URL=https://cms.staging.example
NEXT_PUBLIC_SITE_URL=https://shop.staging.example
CHECKOUT_PROVIDER=mercado-pago
MERCADOPAGO_ACCESS_TOKEN=new-token
MERCADOPAGO_WEBHOOK_SECRET=new-test-secret
MERCADOPAGO_SANDBOX=true
MERCADOPAGO_WEBHOOK_URL=https://shop.staging.example/api/checkout/webhooks/mercado-pago
EOF

bash "$SCRIPT_DIR/update-runtime-env.sh" "$managed" "$target"

assert_line "$target" 'NODE_ENV=production'
assert_line "$target" 'COMMERCE_PROVIDER=payload'
assert_line "$target" 'PAYLOAD_ECOMMERCE_URL=https://cms.staging.example'
assert_line "$target" 'PAYLOAD_ECOMMERCE_CURRENCY=ARS'
assert_line "$target" 'PAYLOAD_ECOMMERCE_AMOUNT_IS_CENTS=true'
assert_line "$target" 'PAYLOAD_CMS_URL=https://cms.staging.example'
assert_line "$target" 'NEXT_PUBLIC_SITE_URL=https://shop.staging.example'
assert_line "$target" 'CHECKOUT_PROVIDER=mercado-pago'
assert_line "$target" 'MERCADOPAGO_ACCESS_TOKEN=new-token'
assert_line "$target" 'MERCADOPAGO_WEBHOOK_SECRET=new-test-secret'
assert_line "$target" 'MERCADOPAGO_SANDBOX=true'
assert_line "$target" 'MERCADOPAGO_WEBHOOK_URL=https://shop.staging.example/api/checkout/webhooks/mercado-pago'
assert_line "$target" 'UNMANAGED_SECRET=keep-me'
[[ "$(grep -c '^MERCADOPAGO_ACCESS_TOKEN=' "$target")" -eq 1 ]] || fail 'Managed key was duplicated.'
if [[ "$(uname -s)" != MINGW* ]]; then
  [[ "$(stat -c '%a' "$target")" == '600' ]] || fail 'Target permissions must be 600.'
fi

cat > "$managed" <<'EOF'
DATABASE_URL=must-not-be-managed
EOF
if bash "$SCRIPT_DIR/update-runtime-env.sh" "$managed" "$target" >/dev/null 2>&1; then
  fail 'Unsupported keys must be rejected.'
fi

cat > "$managed" <<'EOF'
MERCADOPAGO_SANDBOX=true
MERCADOPAGO_SANDBOX=false
EOF
if bash "$SCRIPT_DIR/update-runtime-env.sh" "$managed" "$target" >/dev/null 2>&1; then
  fail 'Duplicate managed keys must be rejected.'
fi

printf 'Runtime environment update tests passed.\n'
