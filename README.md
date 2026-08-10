# Pueblo Mágico

Multilingual headless ecommerce storefront for Pueblo Mágico.

## Stack

- Next.js 15 / React 19 / TypeScript
- Tailwind CSS 4
- next-intl (EN / ES)
- Provider-agnostic commerce layer (Shopify + Payload Ecommerce adapters)

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (redirects to `/en`).

### Useful routes

| Route | Purpose |
| --- | --- |
| `/en`, `/es` | Localized storefront |
| `/ui-system` | Design system reference |
| `/en/cart` | Cart page shell |

## Commerce (Shopify)

Catalog and cart go through `@/lib/commerce`, not Shopify-specific imports in feature code.

```ts
import { commerce } from "@/lib/commerce";

const { items } = await commerce.getProducts({ first: 12 });
```

Required env (see `.env.example`):

- `COMMERCE_PROVIDER=shopify`
- `SHOPIFY_STORE_DOMAIN`
- `SHOPIFY_STOREFRONT_ACCESS_TOKEN`

## Documentation

- [Docs home](./docs/README.md)
- [Commerce developer guide](./docs/commerce/developer.md)
- [Shopify content & merchandising guide](./docs/commerce/content.md)
- [Payload Ecommerce provider](./docs/commerce/payload-ecommerce.md)
- [Build plan (COMMAND.md)](./COMMAND.md)

## Scripts

```bash
npm run dev      # local development
npm run build    # production build
npm run start    # start production server
npm run lint     # eslint
```
