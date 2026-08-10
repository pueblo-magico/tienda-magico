# Checkout abstraction

Provider-agnostic checkout used by the storefront cart. Swap Mercado Pago, commerce-native checkout (Shopify), or future gateways without changing UI code.

## Public API

```ts
import { checkout } from "@/lib/checkout";

const session = await checkout.createCheckoutSession({
  cart,
  locale: "es",
  returnUrls: {
    success: "https://site/es/checkout/success",
    failure: "https://site/es/checkout/failure",
    pending: "https://site/es/checkout/pending",
  },
});

// session.redirectUrl → browser redirect
```

| Piece | Path |
| --- | --- |
| Types | `src/types/checkout.ts` |
| Contract | `src/lib/checkout/provider.ts` |
| Factory | `src/lib/checkout/create-provider.ts` |
| Facade | `src/lib/checkout/index.ts` |
| Mercado Pago | `src/lib/checkout/providers/mercado-pago/*` |
| Commerce URL | `src/lib/checkout/providers/commerce-redirect/*` |
| HTTP API | `POST /api/checkout` |
| MP webhook | `POST /api/checkout/webhooks/mercado-pago` |
| Result pages | `/[locale]/checkout/{success,failure,pending}` |

## Providers

### `mercado-pago` (Checkout Pro Preferences API)

Env:

- `CHECKOUT_PROVIDER=mercado-pago` (or auto when token is set)
- `MERCADOPAGO_ACCESS_TOKEN` (required) — put this in **`.env.local`** (not `.env.example`)
- `MERCADOPAGO_SANDBOX=true|false` (default: token starts with `TEST-`)
- `NEXT_PUBLIC_SITE_URL` for return + webhook URLs

Local dev notes:

- Credentials must live in `.env.local` (Next.js does not load `.env.example`).
- Restart `npm run dev` after changing env vars.
- `auto_return` and `notification_url` are only sent when `NEXT_PUBLIC_SITE_URL` is public **HTTPS**. On `http://localhost` checkout still opens Mercado Pago; buyers won’t auto-redirect back until you use a tunnel/public URL.

Flow:

1. Cart UI calls `POST /api/checkout` with `cartId` + `locale`
2. Server loads cart via commerce layer
3. Provider creates a Preference (`POST /checkout/preferences`)
4. Client redirects to `init_point` / `sandbox_init_point`
5. MP returns to success / failure / pending routes
6. Optional IPN hits webhook route

### `commerce-redirect`

Uses `cart.checkoutUrl` from the commerce provider (Shopify Checkout). No payment credentials.

```env
CHECKOUT_PROVIDER=commerce-redirect
```

## Adding a provider

1. Implement `CheckoutProvider` in `src/lib/checkout/providers/<name>/`
2. Register in `create-provider.ts`
3. Extend `CheckoutProviderName` in `src/types/checkout.ts`
4. Add env vars to `.env.example`

## Cart integration

`CartProvider.checkout()` calls `/api/checkout` and redirects. The checkout button is enabled when the cart has lines (not only when `cart.checkoutUrl` is set).

## Checkout entry route

`/[locale]/checkout` (optional `?cart=cartId::secret`) starts a session via `POST /api/checkout` and redirects to the active provider.

Payload sets `cart.checkoutUrl` to this path. With Mercado Pago configured, users are sent to MP. Without a real provider, the page shows a configuration error instead of looping.
