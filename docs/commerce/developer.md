# Commerce developer guide (Shopify)

This guide covers the headless commerce layer used by Pueblo Mágico.

The storefront **does not talk to Shopify Admin**.  
It uses a **provider-agnostic commerce API**, with **Shopify Storefront API** as the default adapter.

---

## Goals

- Keep UI/feature code independent of Shopify SDK details
- Support cart + catalog operations needed by shop, PDP, and checkout redirect
- Allow swapping commerce backends later (e.g. Medusa, custom) with minimal app changes

---

## Architecture

```text
App routes / features / cart UI
        │
        ▼
 src/lib/commerce          ← public API (use this)
        │
        ▼
 CommerceProvider          ← interface contract
        │
        ▼
 providers/shopify         ← Storefront GraphQL adapter
       providers/payload-ecommerce ← REST → apps/cms
        │
        ▼
 Shopify Storefront API
```

### Key paths

| Path | Role |
| --- | --- |
| `src/types/commerce.ts` | Provider-agnostic domain types (`Product`, `Cart`, …) |
| `src/lib/commerce/provider.ts` | `CommerceProvider` interface |
| `src/lib/commerce/index.ts` | `commerce` facade + `getCommerceProvider()` |
| `src/lib/commerce/create-provider.ts` | Provider factory (`COMMERCE_PROVIDER`) |
| `src/lib/commerce/providers/shopify/*` | Shopify implementation |
| `src/lib/commerce/providers/payload-ecommerce/*` | Self-hosted Payload Ecommerce implementation |
| `src/types/shopify.ts` | Compatibility re-exports (prefer `@/types/commerce`) |
| `src/lib/shopify/index.ts` | Deprecated shim (prefer `@/lib/commerce`) |

**Rule:** feature code imports from `@/lib/commerce` and `@/types/commerce` only.

---

## Environment setup

1. Copy env template:

```bash
cp .env.example .env.local
```

2. Fill Shopify values:

```bash
COMMERCE_PROVIDER=shopify
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SHOPIFY_API_VERSION=2025-01

# or Payload Ecommerce (self-hosted)
# COMMERCE_PROVIDER=payload
# PAYLOAD_ECOMMERCE_URL=http://localhost:4000
# PAYLOAD_ECOMMERCE_CURRENCY=USD
```

### Variable reference

| Variable | Required | Notes |
| --- | --- | --- |
| `COMMERCE_PROVIDER` | No (default `shopify`) | Active adapter name (`shopify` or `payload`) |
| `SHOPIFY_STORE_DOMAIN` | Yes for Shopify | Host only, no `https://` |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Yes for Shopify | Storefront API token (not Admin API) |
| `SHOPIFY_API_VERSION` | No | Defaults to `2025-01` |

### Create a Storefront API token (Shopify admin)

1. Shopify Admin → **Settings** → **Apps and sales channels**
2. **Develop apps** → create/install a custom app
3. Configure **Storefront API** scopes (minimum useful set):
   - `unauthenticated_read_product_listings`
   - `unauthenticated_read_product_inventory`
   - `unauthenticated_read_collection_listings`
   - `unauthenticated_write_checkouts` / cart scopes as shown for your API version  
     (cart mutations require Storefront cart access)
4. Install app → copy **Storefront API access token**
5. Put token + shop domain into `.env.local`
6. Restart `npm run dev`

> Never commit `.env.local`. Tokens are secrets.

---

## Quick start usage

```ts
import { commerce, formatMoney } from "@/lib/commerce";
import type { Product } from "@/types/commerce";

// Guard optional environments (local without credentials)
if (!commerce.isConfigured()) {
  // render empty/fallback UI
}

// Catalog
const { items, pageInfo } = await commerce.getProducts({
  first: 12,
  sortKey: "BEST_SELLING",
});

const product = await commerce.getProduct("organic-mountain-cacao");

const collections = await commerce.getCollections({ first: 20 });
const collection = await commerce.getCollection("best-sellers", 24);

// Cart
const cart = await commerce.createCart({
  lines: [{ merchandiseId: variantId, quantity: 1 }],
});

const next = await commerce.addCartLines(cart.id, [
  { merchandiseId: anotherVariantId, quantity: 2 },
]);

await commerce.updateCart(cart.id, [{ id: lineId, quantity: 3 }]);
await commerce.removeCartLines(cart.id, [lineId]);

// Checkout (hosted Shopify checkout)
window.location.href = next.checkoutUrl;

// Money formatting
formatMoney(product.priceRange.minVariantPrice, "en-US");
```

Server Components / route handlers are preferred for catalog reads.  
Cart writes should run on the server (Server Actions or route handlers) so the Storefront token stays private.

---

## API reference

All methods are available on:

- `commerce.*`
- `getCommerceProvider().*`

### Catalog

#### `getProducts(params?)`

```ts
type GetProductsParams = {
  first?: number;          // default 24
  after?: string;          // cursor
  query?: string;          // Storefront search syntax
  sortKey?: "TITLE" | "PRICE" | "BEST_SELLING" | "CREATED" | ...;
  reverse?: boolean;
};
```

Returns `Paginated<ProductSummary>`.

#### `getProduct(handle)`

Returns full `Product` (variants, options, images, SEO) or `null`.

#### `getCollections(params?)`

Returns `Paginated<CollectionSummary>`.

#### `getCollection(handle, productsFirst?)`

Returns `Collection` including nested product summaries, or `null`.

### Cart

| Method | Purpose |
| --- | --- |
| `createCart({ lines?, note? })` | Create cart, optionally with lines |
| `getCart(cartId)` | Load cart by id |
| `addCartLines(cartId, lines)` | Add variant lines |
| `updateCart` / `updateCartLines` | Set quantities |
| `removeCartLines(cartId, lineIds)` | Remove lines |

Cart line input:

```ts
type CartLineInput = {
  merchandiseId: string; // ProductVariant GID, e.g. gid://shopify/ProductVariant/123
  quantity: number;
};
```

`Cart.checkoutUrl` is the hosted Shopify checkout entrypoint.

### Configuration helpers

```ts
commerce.isConfigured();          // boolean
getCommerceProvider().name;       // "shopify"
createCommerceProvider("shopify");
```

### Errors

Thrown from `@/types/commerce`:

- `CommerceConfigError` — missing/invalid env or unknown provider
- `CommerceError` — transport/GraphQL/userErrors failures (`provider`, `status`, `errors`)

Handle config errors as “commerce disabled”; handle `CommerceError` as recoverable request failures.

---

## Caching notes (Shopify adapter)

Current defaults:

- Product/collection reads: `next: { revalidate: 60|120, tags: [...] }`
- Cart operations: `cache: "no-store"`

Useful tags:

- `products`
- `product:{handle}`
- `collections`
- `collection:{handle}`

When merchandisers publish catalog changes and you need immediate refresh, revalidate those tags from a secure webhook/admin path (future work).

---

## Adding another provider

1. Implement `CommerceProvider` in e.g. `src/lib/commerce/providers/medusa/provider.ts`
2. Map vendor payloads into `@/types/commerce` domain types
3. Register in `create-provider.ts`:

```ts
const providers = {
  shopify: shopifyCommerceProvider,
  medusa: medusaCommerceProvider,
} as const;
```

4. Extend `CommerceProviderName` in `src/types/commerce.ts`
5. Set `COMMERCE_PROVIDER=medusa`
6. Keep Shopify files untouched by feature code

Do **not** branch on provider name inside UI components.  
If a capability is provider-specific, extend the shared interface carefully or add an optional capability interface.

---

## Local development without Shopify

If env vars are missing:

- `commerce.isConfigured()` returns `false`
- Calling catalog/cart methods throws `CommerceConfigError`

Recommended pattern for pages:

```ts
if (!commerce.isConfigured()) {
  return <CatalogUnavailable />;
}
```

This keeps builds and UI work unblocked before credentials exist.

---

## Security checklist

- [ ] Storefront token only in server env (`.env.local`, hosting secrets)
- [ ] No Storefront token in client bundles
- [ ] Cart mutations via server actions / route handlers
- [ ] Validate quantities and variant IDs before calling provider
- [ ] Do not log full tokens or raw checkout payloads in production

---

## Testing checklist

- [ ] `commerce.isConfigured()` true with local env
- [ ] `getProducts()` returns published products
- [ ] `getProduct(handle)` resolves by Shopify handle
- [ ] `getCollections()` / `getCollection(handle)` work
- [ ] `createCart` + `addCartLines` + `updateCart` + `removeCartLines`
- [ ] `checkoutUrl` opens Shopify checkout
- [ ] Missing env fails with `CommerceConfigError`
- [ ] App still builds when env is absent (`npm run build`)

---

## Related content ops

Merchandising/editorial workflow for catalog data lives in:

→ [Shopify content guide](./content.md)


---

## Localization notes

- Storefront chrome: `next-intl` EN/ES
- Shopify catalog: depends on Shopify Markets/translations setup
- Payload catalog (`apps/cms`): **en / es** localization on catalogue fields
- Pass `locale` into `commerce.getProducts` / `getProduct` / `getCollection` (Payload adapter maps to REST `locale` + `fallback-locale`)
