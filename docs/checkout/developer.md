# Checkout developer guide

Provider-agnostic checkout for the Pueblo Mágico storefront. Feature code talks to `@/lib/checkout` (or `POST /api/checkout`); payment gateways are swappable adapters.

Related:

- Operator setup (Mercado Pago credentials, sandbox) → [operations.md](./operations.md)
- Commerce carts / catalog → [commerce developer guide](../commerce/developer.md)
- Payload cart `checkoutUrl` → [payload-ecommerce.md](../commerce/payload-ecommerce.md)

---

## Goals

- Keep cart UI independent of Mercado Pago / Shopify checkout SDKs
- Support Checkout Pro (hosted redirect) today; allow Stripe / other gateways later
- Work with both commerce backends (`shopify` → native URL, `payload` → MP preferences)

---

## Architecture

```text
Cart UI / /[locale]/checkout
        │
        ▼
 POST /api/checkout          ← HTTP boundary (browser)
        │
        ▼
 src/lib/checkout            ← public facade (`checkout`)
        │
        ▼
 CheckoutProvider            ← interface contract
        │
        ├─ mercado-pago      ← Preferences API → init_point
        └─ commerce-redirect ← cart.checkoutUrl (Shopify)
                │
                ▼
         Browser redirect to payment host
```

**Rule:** feature code imports from `@/lib/checkout` and `@/types/checkout` only (or the thin client helper in `@/features/checkout`). Do not call Mercado Pago REST from components.

### Key paths

| Path                                                  | Role                                                   |
| ----------------------------------------------------- | ------------------------------------------------------ |
| `src/types/checkout.ts`                               | Domain types + `CheckoutError` / `CheckoutConfigError` |
| `src/lib/checkout/provider.ts`                        | `CheckoutProvider` interface                           |
| `src/lib/checkout/index.ts`                           | `checkout` facade + `getCheckoutProvider()`            |
| `src/lib/checkout/create-provider.ts`                 | Factory (`CHECKOUT_PROVIDER` + auto-detect)            |
| `src/lib/checkout/providers/mercado-pago/*`           | Checkout Pro Preferences adapter                       |
| `src/lib/checkout/providers/commerce-redirect/*`      | Shopify / external `checkoutUrl`                       |
| `src/features/checkout/*`                             | Client `createCheckoutSession`, `CheckoutStart`        |
| `src/app/api/checkout/route.ts`                       | `GET` status / `POST` create session                   |
| `src/app/api/checkout/webhooks/mercado-pago/route.ts` | IPN / webhook stub                                     |
| `src/app/[locale]/checkout/**`                        | Entry + success / failure / pending pages              |

---

## Environment setup

1. Copy template values into **`.env.local`** (Next.js does **not** load `.env.example`):

```bash
cp .env.example .env.local
# then edit .env.local — never commit real tokens
```

2. Mercado Pago (Payload / custom payment path):

```bash
CHECKOUT_PROVIDER=mercado-pago
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxxxxxx   # or APP_USR-… for production apps
MERCADOPAGO_SANDBOX=true
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

3. Shopify-hosted checkout only:

```bash
CHECKOUT_PROVIDER=commerce-redirect
# COMMERCE_PROVIDER=shopify + Shopify env as usual
```

4. Restart the storefront after any env change (`npm run dev`).

### Variable reference

| Variable                           | Required    | Notes                                                                                     |
| ---------------------------------- | ----------- | ----------------------------------------------------------------------------------------- |
| `CHECKOUT_PROVIDER`                | No          | `mercado-pago` \| `commerce-redirect`. Auto: MP when token is set, else commerce-redirect |
| `MERCADOPAGO_ACCESS_TOKEN`         | For MP      | Access token from MP Developers. Alias: `MP_ACCESS_TOKEN`                                 |
| `MERCADOPAGO_SANDBOX`              | No          | Legacy compatibility flag. Checkout Pro test credentials use the returned `init_point`    |
| `MERCADOPAGO_API_BASE_URL`         | No          | Default `https://api.mercadopago.com`                                                     |
| `MERCADOPAGO_STATEMENT_DESCRIPTOR` | No          | Card statement text (max 22)                                                              |
| `MERCADOPAGO_BINARY_MODE`          | No          | `true` → approved or rejected only                                                        |
| `MERCADOPAGO_WEBHOOK_URL`          | No          | Public HTTPS webhook override                                                             |
| `CHECKOUT_WEBHOOK_URL`             | No          | Generic alias for notification URL                                                        |
| `NEXT_PUBLIC_SITE_URL`             | Recommended | Absolute site origin for return URLs                                                      |

---

## Public server API

```ts
import { checkout } from "@/lib/checkout";

if (!checkout.isConfigured()) {
  // show config error
}

const session = await checkout.createCheckoutSession({
  cart,
  locale: "es",
  customer: { email: "buyer@example.com" },
  returnUrls: {
    success: "https://site/es/checkout/success",
    failure: "https://site/es/checkout/failure",
    pending: "https://site/es/checkout/pending",
  },
  externalReference: cart.id,
  notificationUrl: "https://site/api/checkout/webhooks/mercado-pago",
});

// session.redirectUrl → send the browser here
```

Optional:

```ts
const payment = await checkout.getPayment(paymentId); // MP only
```

---

## HTTP API

### `GET /api/checkout`

Provider health (no secrets).

```json
{
  "provider": "mercado-pago",
  "configured": true,
  "commerceConfigured": true
}
```

### `POST /api/checkout`

Body:

```json
{
  "cartId": "12::secret",
  "locale": "es",
  "email": "optional@buyer.com",
  "name": "Optional Name"
}
```

Success (`200`):

```json
{
  "configured": true,
  "session": {
    "id": "preference-id",
    "provider": "mercado-pago",
    "redirectUrl": "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=…",
    "status": "ready",
    "expiresAt": null
  }
}
```

Errors:

| Status | When                                                                      |
| ------ | ------------------------------------------------------------------------- |
| `400`  | Missing `cartId`, empty cart, or gateway validation (e.g. bad preference) |
| `404`  | Cart not found / empty                                                    |
| `503`  | Commerce or checkout provider not configured                              |
| `502`  | Upstream gateway / `CheckoutError`                                        |

### Client helper

```ts
import { createCheckoutSession } from "@/features/checkout";

const { session } = await createCheckoutSession({
  cartId,
  locale: "es",
});
window.location.href = session.redirectUrl;
```

---

## Providers

### `mercado-pago` (Checkout Pro)

1. Maps cart lines → preference `items` (`map-cart.ts`)
2. `POST /checkout/preferences` with bearer access token
3. Returns `init_point`; uses `sandbox_init_point` only when the API omits the current URL
4. Sets `external_reference` to the commerce cart id (including Payload `id::secret`)

**Localhost constraints (important):**

- Mercado Pago rejects `auto_return` unless `back_urls.success` is **public HTTPS** (not `http://localhost`).
- The adapter **omits** `auto_return` and `notification_url` on non-public URLs so local checkout still opens MP.
- Buyers will not auto-return to the storefront until `NEXT_PUBLIC_SITE_URL` is a public HTTPS origin (tunnel or deploy).

### `commerce-redirect`

Uses `cart.checkoutUrl` from `@/lib/commerce` (Shopify Checkout).

**Self-host guard:** if `checkoutUrl` points at this storefront’s `/checkout` or `/{locale}/checkout` (Payload placeholder), the provider throws instead of looping. Configure Mercado Pago for Payload carts.

### Bank transfer

Bank transfer is an internal pending-payment flow rather than an external checkout provider:

1. The customer selects `bank-transfer` in the cart.
2. The customer provides a name and valid email before checkout.
3. `POST /api/checkout` creates an idempotent ecommerce order using a transfer-specific checkout key; Payload generates its public UUID reference and stores `paymentStatus: pending`.
4. Payload creates the linked local-sale record with `pending_payment` / `pending` status.
5. The order and local sale persist the payment method and payment deadline.
6. The storefront redirects with only the public order reference. The pending page loads the exact amount, deadline, payment method, and status from the persisted order before showing the CMS-managed account instructions.

Creating the pending order does not confirm payment, reserve stock, or reduce stock. Payment verification and expiry processing remain separate milestones.

Los reintentos de transferencia conservan el pedido anterior. Si el intento está vencido, rechazado o cancelado, el checkout deriva la siguiente clave idempotente de su ID interno y crea otro pedido con el carrito actual. La restricción única existente sobre `checkoutKey` resuelve solicitudes simultáneas; las repeticiones reutilizan el nuevo intento activo. Los estados aprobados o sin verificar no habilitan esta renovación. «Ya hice la transferencia» solo consulta el estado original. No se extienden plazos anteriores ni se procesan pagos tardíos automáticamente.

La página de espera consulta el estado persistido cada diez segundos con la pestaña visible y permite una consulta manual. La cuenta regresiva usa el vencimiento persistido y la hora del servidor. Al vencer, oculta las instrucciones sin modificar el pedido; continúa consultando para mostrar una eventual confirmación tardía. Los estados aprobado, rechazado y cancelado detienen la consulta automática. Ver [guía de prueba manual](transfer-waiting-manual-test.md).

---

## Routes (storefront)

| Route                        | Purpose                                                |
| ---------------------------- | ------------------------------------------------------ |
| `/[locale]/checkout`         | Entry: optional `?cart=`; starts session and redirects |
| `/[locale]/checkout/success` | Return URL after approved payment                      |
| `/[locale]/checkout/failure` | Return URL after failure / cancel                      |
| `/[locale]/checkout/pending` | Return URL while payment is pending                    |
| `/[locale]/cart`             | Cart UI; Checkout CTA → `POST /api/checkout`           |

Payload default `Cart.checkoutUrl` is `{SITE}/checkout?cart={id::secret}`, rewritten by locale middleware to `/en/checkout` or `/es/checkout`.

---

## Cart integration

- `CartProvider.checkout()` calls `/api/checkout` with the stored cart id + active locale, then assigns `window.location` to `session.redirectUrl`.
- Checkout CTA is enabled when the cart has lines (does **not** require a non-empty commerce `checkoutUrl`).
- Storage key for cart id remains `pm_cart_id`.

---

## Webhooks

`POST /api/checkout/webhooks/mercado-pago` (also accepts GET pings).

Current behavior:

- Parses JSON body, form body, or query (`topic` / `id` / `data.id`)
- Optionally loads payment via `checkout.getPayment`
- Always responds `200` with a small JSON ack (avoids aggressive MP retries in dev)
- **Does not** yet mark orders fulfilled in Payload — extend here later

For production notifications, set a **public HTTPS** `MERCADOPAGO_WEBHOOK_URL` (or rely on `{SITE}/api/checkout/webhooks/mercado-pago` when `NEXT_PUBLIC_SITE_URL` is public HTTPS).

---

## Adding a payment provider

1. Implement `CheckoutProvider` under `src/lib/checkout/providers/<name>/`
2. Register in `create-provider.ts` (`resolveCheckoutProviderName` + `createCheckoutProvider`)
3. Extend `CheckoutProviderName` in `src/types/checkout.ts`
4. Add env keys to `.env.example` and [operations.md](./operations.md)
5. Wire webhook route if the gateway sends async events
6. Keep UI on `/api/checkout` only

Do **not** branch on provider name inside presentational components.

---

## Troubleshooting

| Symptom                                                                           | Likely cause                                    | Fix                                                                             |
| --------------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------- |
| “No external payment provider is configured”                                      | Token only in `.env.example`, or wrong provider | Put vars in **`.env.local`**, set `CHECKOUT_PROVIDER=mercado-pago`, restart dev |
| `GET /api/checkout` → `commerce-redirect` + `configured: true` but checkout fails | Payload self `checkoutUrl` blocked              | Configure MP token; confirm provider name is `mercado-pago`                     |
| `auto_return invalid. back_url.success must be defined`                           | Old build or forced auto_return on localhost    | Use current adapter (skips auto_return on non-public URLs)                      |
| `POST /api/checkout` 404 cart                                                     | Stale / missing cart id                         | Re-add items; check `pm_cart_id` and Payload cart secret format `id::secret`    |
| Preference 400 on items/currency                                                  | Bad prices or mixed currencies                  | Ensure cart line amounts are finite; single currency per cart                   |
| No redirect back after paying (local)                                             | Expected without public HTTPS                   | Use ngrok/cloudflared or test return pages manually                             |
| Images / titles wrong at MP                                                       | Cart enrichment / CMS locale                    | See commerce cart docs; set EN+ES product titles                                |

### Quick health check

```bash
curl -s http://localhost:3000/api/checkout | jq
# expect: "provider":"mercado-pago","configured":true
```

---

## Security checklist

- [ ] Access token only in `.env.local` / host secrets — never in `.env.example` commits
- [ ] No MP token in client bundles (`NEXT_PUBLIC_*` must not include secrets)
- [ ] Checkout session creation only via server route / server code
- [ ] Do not log full tokens, full preference payloads, or card data
- [ ] Webhook fulfillment (when added) must verify authenticity before mutating orders
- [ ] Prefer `TEST-` tokens for local/sandbox; rotate any token that was pasted into git-tracked files

---

## Testing checklist

- [ ] `GET /api/checkout` reports expected provider + `configured: true`
- [ ] Cart with lines → Checkout → browser lands on Mercado Pago (or Shopify) host
- [ ] `/en/checkout?cart=…` creates a session (200) when MP is configured
- [ ] Missing token → clear config error, no infinite redirect loop
- [ ] Success / failure / pending pages render for both locales
- [ ] `npm run build` succeeds without MP env (build-time)
- [ ] Webhook route returns 200 for a sample POST body

---

## Localization

- UI chrome: `next-intl` keys under `checkout.*` in `messages/en.json` / `messages/es.json`
- Preference item titles come from commerce cart lines (already locale-aware when cart API passes `locale`)
- Return URLs include the active locale segment (`/es/checkout/success`, …)
