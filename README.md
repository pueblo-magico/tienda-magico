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
| `/en`, `/es` | Localized storefront (CMS home page `home` or fallback) |
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


## Monorepo layout

| Path | Role | Default port |
| --- | --- | --- |
| `/` (this app) | Next.js storefront | `3000` |
| [`apps/cms`](./apps/cms) | Payload CMS + Ecommerce backend | `4000` |

### Local CMS

```bash
npm run db:cms:up          # Postgres on localhost:5433
npm run dev:cms            # Payload admin http://localhost:4000/admin
```

Point the storefront at it:

```bash
COMMERCE_PROVIDER=payload
PAYLOAD_ECOMMERCE_URL=http://localhost:4000
```

See [apps/cms/README.md](./apps/cms/README.md) and [docs/commerce/payload-ecommerce.md](./docs/commerce/payload-ecommerce.md).

## Documentation

- [Docs home](./docs/README.md)
- [Commerce developer guide](./docs/commerce/developer.md)
- [Shopify content & merchandising guide](./docs/commerce/content.md)
- [Payload Ecommerce provider](./docs/commerce/payload-ecommerce.md)
- [Payload content & merchandising](./docs/commerce/payload-content.md)
- [CMS homepage (developer)](./docs/cms/developer.md)
- [CMS homepage (content editors)](./docs/cms/content.md)
- [CMS app README](./apps/cms/README.md)
- [Build plan (COMMAND.md)](./COMMAND.md)

## Scripts

```bash
npm run dev          # storefront (:3000)
npm run build        # storefront production build
npm run start        # storefront production server
npm run lint         # eslint (storefront only; apps/ excluded)
npm run db:cms:up    # CMS Postgres (:5433)
npm run dev:cms      # CMS (:4000)
npm run build:cms    # CMS production build
npm run start:cms    # CMS production server
```

## Localization status

| Layer | EN / ES |
| --- | --- |
| Storefront UI (`next-intl`) | Yes |
| Payload CMS catalog content | Yes (`en` / `es`, fallback to `en`) |
