# Payload Ecommerce provider (self-hosted)

Adapter: `src/lib/commerce/providers/payload-ecommerce`

Implements the shared `CommerceProvider` contract against a **self-hosted Payload CMS** app using `@payloadcms/plugin-ecommerce`.

## Enable

```bash
COMMERCE_PROVIDER=payload
PAYLOAD_ECOMMERCE_URL=http://localhost:4000
PAYLOAD_ECOMMERCE_CURRENCY=USD
```

Optional server API key:

```bash
PAYLOAD_ECOMMERCE_API_KEY=...
PAYLOAD_ECOMMERCE_API_KEY_COLLECTION=users
```

App code stays the same:

```ts
import { commerce } from "@/lib/commerce";

const { items } = await commerce.getProducts({ first: 12 });
const cart = await commerce.createCart({
  lines: [{ merchandiseId: variantId, quantity: 1 }],
});
```

## Expected Payload collections

From `@payloadcms/plugin-ecommerce` (defaults):

| Slug | Purpose |
| --- | --- |
| `products` | Catalog products (draft/publish) |
| `variants` | Variant rows joined to products |
| `carts` | Persisted carts + item endpoints |
| `categories` (optional) | Used for `getCollections()` / `getCollection()` |

Collection slugs are configurable via env (`PAYLOAD_ECOMMERCE_*_SLUG`).

### Product fields mapped

The adapter is intentionally flexible and reads common template fields:

- identity: `title`/`name`, `slug`/`handle`, `id`
- copy: `description` / `richText` / `summary`
- media: `media`, `gallery`, `images`, `image`, `featuredImage`
- pricing: `priceInUSD` (or configured currency), `price`, `amount`
- variants join: `variants.docs` or `variants[]`
- inventory: `inventory`
- SEO: `meta.title`, `meta.description`

### Cart endpoints used

| Operation | Payload route |
| --- | --- |
| Create cart | `POST /api/carts` |
| Get cart | `GET /api/carts/:id` |
| Add line | `POST /api/carts/:id/add-item` |
| Update qty | `POST /api/carts/:id/update-item` |
| Remove line | `POST /api/carts/:id/remove-item` |

Guest carts require `allowGuestCarts: true` in the Payload ecommerce plugin cart config.

### Cart id + secret

Payload guest carts use a hidden `secret`.  
This adapter encodes it into `Cart.id` as:

```text
{cartId}::{secret}
```

Pass that full value back into `getCart` / `addCartLines` / etc.

### merchandiseId formats

| Value | Meaning |
| --- | --- |
| `variantId` | Resolve variant, then parent product |
| `productId` | Simple product (no variant) |
| `variant:variantId` | Explicit variant |
| `product:productId` | Explicit product |
| `productId:variantId` | Explicit pair |

### Checkout URL

`Cart.checkoutUrl` points to:

- `PAYLOAD_ECOMMERCE_CHECKOUT_URL`, or
- `NEXT_PUBLIC_SITE_URL` + `PAYLOAD_ECOMMERCE_CHECKOUT_PATH` (default `/checkout`)

with `?cart={cartRef}`.

Implement your storefront checkout page to read that query param and continue payment (Stripe adapter on Payload, etc.).

## Payload plugin checklist

On the Payload app:

1. Install `@payloadcms/plugin-ecommerce`
2. Enable products + variants + carts
3. Enable guest carts if you need anonymous checkout
4. Configure currency codes to match `PAYLOAD_ECOMMERCE_CURRENCY`
5. Publish products (`_status: published`) and allow Storefront/public read access as needed
6. Ensure CORS allows the Next.js origin if browser calls are used (prefer server-side calls)

## Switching providers

```bash
# Shopify
COMMERCE_PROVIDER=shopify

# Payload Ecommerce
COMMERCE_PROVIDER=payload
# alias also supported:
# COMMERCE_PROVIDER=payload-ecommerce
```

No feature-code changes required when using `@/lib/commerce`.
