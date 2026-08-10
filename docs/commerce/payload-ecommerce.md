# Payload Ecommerce provider (self-hosted)

Storefront adapter: `src/lib/commerce/providers/payload-ecommerce`  
CMS app: [`apps/cms`](../../apps/cms)

Implements the shared `CommerceProvider` contract against a **self-hosted Payload CMS** using `@payloadcms/plugin-ecommerce` over **REST**.

Content editors: see [payload-content.md](./payload-content.md).

---

## Backend in this repo

```bash
# from monorepo root
npm run db:cms:up    # Postgres on localhost:5433
npm run dev:cms      # http://localhost:4000
```

| URL | Purpose |
| --- | --- |
| `http://localhost:4000/admin` | Payload admin |
| `http://localhost:4000/api` | REST API |

CMS setup details: [`apps/cms/README.md`](../../apps/cms/README.md).

---

## Enable on the storefront

```bash
COMMERCE_PROVIDER=payload
# aliases: payload-ecommerce, payload_ecommerce, payloadcms

PAYLOAD_ECOMMERCE_URL=http://localhost:4000
PAYLOAD_ECOMMERCE_CURRENCY=USD
PAYLOAD_ECOMMERCE_AMOUNT_IS_CENTS=true
PAYLOAD_ECOMMERCE_COLLECTIONS_SLUG=categories

# Optional API key (Users → enable API key in admin)
# PAYLOAD_ECOMMERCE_API_KEY=...
# PAYLOAD_ECOMMERCE_API_KEY_COLLECTION=users

# Optional overrides
# PAYLOAD_ECOMMERCE_API_PREFIX=/api
# PAYLOAD_ECOMMERCE_PRODUCTS_SLUG=products
# PAYLOAD_ECOMMERCE_VARIANTS_SLUG=variants
# PAYLOAD_ECOMMERCE_CARTS_SLUG=carts
# PAYLOAD_ECOMMERCE_CHECKOUT_PATH=/checkout
# PAYLOAD_ECOMMERCE_CHECKOUT_URL=https://shop.example.com/checkout
# PAYLOAD_ECOMMERCE_DEPTH=2
# NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

App code stays provider-agnostic:

```ts
import { commerce } from "@/lib/commerce";

const { items } = await commerce.getProducts({ first: 12 });
const cart = await commerce.createCart({
  lines: [{ merchandiseId: variantId, quantity: 1 }],
});
```

---

## Architecture

```text
Storefront (Next :3000)
  └─ @/lib/commerce
       └─ providers/payload-ecommerce  (REST fetch)
            └─ apps/cms Payload (:4000) + Postgres
```

Same VM is fine: two Node processes + one Postgres.

---

## Expected collections

| Slug | Purpose |
| --- | --- |
| `products` | Catalog (draft/publish) + catalogue fields override |
| `variants` | Variant rows joined to products |
| `carts` | Persisted carts + item endpoints |
| `categories` | Storefront `getCollections()` / `getCollection()` |
| `media` | Images |
| `users` | Admins / API keys / customers |

### Product fields mapped by the adapter

- identity: `title` / `name`, `slug` / `handle`, `id`
- copy: `description` / `richText` / `summary`
- media: `gallery`, `media`, `images`, `image`, `featuredImage`
- pricing: `priceInUSD` (or configured currency), `price`, `amount` — often **cents**
- variants: `variants.docs` or `variants[]`
- inventory: `inventory`
- SEO: `meta.title`, `meta.description` (if present)

---

## Cart behavior

| Operation | Payload route |
| --- | --- |
| Create cart | `POST /api/carts` |
| Get cart | `GET /api/carts/:id` |
| Add line | `POST /api/carts/:id/add-item` |
| Update qty | `POST /api/carts/:id/update-item` |
| Remove line | `POST /api/carts/:id/remove-item` |

Guest carts require `allowGuestCarts: true` (enabled in `apps/cms`).

### Cart id + secret

Guest carts use a hidden `secret`. The adapter encodes:

```text
{cartId}::{secret}
```

Pass that full value back into cart methods.

### merchandiseId formats

| Value | Meaning |
| --- | --- |
| `variantId` | Resolve variant → parent product |
| `productId` | Simple product |
| `variant:variantId` | Explicit variant |
| `product:productId` | Explicit product |
| `productId:variantId` | Explicit pair |

### Checkout URL

`Cart.checkoutUrl` → `PAYLOAD_ECOMMERCE_CHECKOUT_URL` or `NEXT_PUBLIC_SITE_URL` + `PAYLOAD_ECOMMERCE_CHECKOUT_PATH` with `?cart={cartRef}`.

That URL is a **storefront entry** (`/[locale]/checkout`), not a payment gateway. Card/wallet payment is handled by the storefront checkout layer (**Mercado Pago Checkout Pro** by default when configured):

- See [checkout developer guide](../checkout/developer.md)
- Operator credentials: [checkout operations](../checkout/operations.md)

Payments are **not** processed inside Payload admin.

---

## Localization

| Layer | Status |
| --- | --- |
| Storefront UI (`next-intl`) | EN / ES |
| Payload catalog fields | **EN / ES** (`apps/cms` localization) |
| Adapter `locale` param | Supported on catalog methods |

### Storefront usage

```ts
import { commerce } from "@/lib/commerce";

const { items } = await commerce.getProducts({ first: 12, locale: "es" });
const product = await commerce.getProduct("mountain-cacao", { locale: "es" });
const collection = await commerce.getCollection("ritual-cacao", {
  productsFirst: 12,
  locale: "es",
});
```

Env (optional defaults for the adapter):

```bash
PAYLOAD_ECOMMERCE_DEFAULT_LOCALE=en
PAYLOAD_ECOMMERCE_FALLBACK_LOCALE=en
```

Slug handles are **shared** across locales. Translate title/description in admin per locale.

---

## CMS checklist

1. `apps/cms` running with Postgres
2. Ecommerce plugin active (products, variants, carts)
3. Guest carts enabled
4. Currency matches `PAYLOAD_ECOMMERCE_CURRENCY` (USD)
5. Products **published**
6. `CORS_ORIGINS` includes the storefront origin
7. After plugin/config changes: `npm run generate:importmap` in `apps/cms`

---

## Switching providers

```bash
COMMERCE_PROVIDER=shopify
# or
COMMERCE_PROVIDER=payload
```

No feature-code changes when using `@/lib/commerce` only.
