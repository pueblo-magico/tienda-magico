# Checkout operations guide

How to configure payments for Pueblo Mágico (Mercado Pago Checkout Pro and Shopify-hosted checkout). For architecture and APIs, see [developer.md](./developer.md).

---

## Which path am I on?

| Commerce backend | Typical checkout | What you configure |
| --- | --- | --- |
| **Payload** (`COMMERCE_PROVIDER=payload`) | **Mercado Pago** Checkout Pro | MP access token on the **storefront** |
| **Shopify** (`COMMERCE_PROVIDER=shopify`) | Shopify Checkout (`commerce-redirect`) | Payments inside Shopify Admin |

Payload does **not** process card payments in CMS. The storefront creates a Mercado Pago preference from the cart and redirects the buyer.

---

## Mercado Pago setup

### 1. Create an application

1. Open [Mercado Pago Developers](https://www.mercadopago.com/developers/panel/app)
2. Create (or select) an application for **Checkout Pro**
3. Copy the **Access Token** for the environment you need:
   - **Test** tokens usually start with `TEST-`
   - **Production** tokens usually start with `APP_USR-`

### 2. Configure the storefront (`.env.local`)

Put secrets only in **`.env.local`** on the machine/host running Next.js.  
Do **not** paste real tokens into `.env.example` (that file is committed).

```bash
CHECKOUT_PROVIDER=mercado-pago
MERCADOPAGO_ACCESS_TOKEN=TEST-your-token-here
MERCADOPAGO_SANDBOX=true
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

| Variable | Purpose |
| --- | --- |
| `CHECKOUT_PROVIDER` | Force `mercado-pago` (recommended when using Payload) |
| `MERCADOPAGO_ACCESS_TOKEN` | Server-side API credential |
| `MERCADOPAGO_SANDBOX` | Prefer sandbox checkout URL when `true` |
| `NEXT_PUBLIC_SITE_URL` | Base URL for success/failure/pending return links |

Restart the storefront after saving:

```bash
npm run dev
```

### 3. Verify configuration

```bash
curl -s http://localhost:3000/api/checkout
```

Expected when ready:

```json
{
  "provider": "mercado-pago",
  "configured": true,
  "commerceConfigured": true
}
```

If `provider` is still `commerce-redirect` or `configured` is false, the token is missing from `.env.local` or the process was not restarted.

### 4. End-to-end smoke test

1. Ensure CMS + storefront are running (`payload` commerce pointed at CMS)
2. Add a product to the cart
3. Open cart → **Checkout**
4. Browser should leave the site for `*.mercadopago.*`
5. Use [MP test cards](https://www.mercadopago.com/developers/en/docs/checkout-pro/additional-content/test-cards) in sandbox

#### Localhost return URLs

On `http://localhost`, Mercado Pago will **not** auto-return the buyer to the shop after payment (HTTPS public URL required for `auto_return`). Checkout still works; use a tunnel (ngrok, Cloudflare Tunnel) and set:

```bash
NEXT_PUBLIC_SITE_URL=https://your-tunnel.example
MERCADOPAGO_SANDBOX=true
```

Then restart and retest if you need success/failure pages after paying.

### 5. Webhooks (production)

Default endpoint:

```text
https://your-domain/api/checkout/webhooks/mercado-pago
```

Optional override:

```bash
MERCADOPAGO_WEBHOOK_URL=https://your-domain/api/checkout/webhooks/mercado-pago
```

Register the same URL in the MP application notifications settings when you go live.

El endpoint ahora exige `MERCADOPAGO_WEBHOOK_SECRET`, consulta el recurso autenticado y guarda una observación privada en el CMS antes de responder `200`. No confirma pedidos automáticamente. Seguí la [guía de notificaciones](mercado-pago-notifications.md) para migración, credenciales, simulación y revisión manual.

---

## Shopify-hosted checkout

When `COMMERCE_PROVIDER=shopify`:

```bash
CHECKOUT_PROVIDER=commerce-redirect
```

No Mercado Pago token is required. Buyers use Shopify Checkout from `cart.checkoutUrl`.

Configure payment methods, taxes, and shipping in **Shopify Admin**, not in this repo. See [commerce content guide](../commerce/content.md).

---

## Credentials hygiene

| Do | Don’t |
| --- | --- |
| Store tokens in `.env.local` or host secret manager | Commit tokens to git |
| Use `TEST-` tokens for day-to-day local work | Put secrets in `.env.example` |
| Rotate tokens if they were shared or committed | Expose tokens in client-side `NEXT_PUBLIC_*` vars |
| Restart the app after rotating tokens | Assume hot-reload picks up new env |

If a production token was ever written into a tracked file, **revoke/rotate it** in the MP panel even if the file was fixed later.

---

## Common operator issues

| Message / behavior | What to do |
| --- | --- |
| “No external payment provider is configured” | Add MP vars to **`.env.local`**, set provider, restart |
| Checkout page 404 | Ensure storefront has `/[locale]/checkout` deployed; hard-refresh |
| Cart works, checkout errors 503 | `GET /api/checkout` — fix `configured: false` |
| Lands on MP but wrong product name | Fix product titles in CMS for the active locale (EN/ES) |
| Shopify store but MP redirect | Set `CHECKOUT_PROVIDER=commerce-redirect` if you want Shopify Checkout |

---

## Go-live checklist

- [ ] Production `MERCADOPAGO_ACCESS_TOKEN` (`APP_USR-…`) in host secrets only
- [ ] `MERCADOPAGO_SANDBOX=false` (or omit when using production token policy you intend)
- [ ] `NEXT_PUBLIC_SITE_URL=https://your-production-domain`
- [ ] Success / failure / pending URLs load over HTTPS
- [ ] Webhook URL registered and reachable from the public internet
- [ ] Test one real small payment (or MP production test procedure for your country)
- [ ] Confirm currency on catalog matches MP account currency expectations
- [ ] Support contact knows how to refund from MP dashboard

---

## Related docs

- [Checkout developer guide](./developer.md)
- [Payload ecommerce adapter](../commerce/payload-ecommerce.md)
- [Docs home](../README.md)
