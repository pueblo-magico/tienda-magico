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
| `/en/cart` | Cart page |
| `/en/shop` | Product listing |
| `/en/checkout` | Start checkout (Mercado Pago / commerce redirect) |

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


## Checkout

Payments go through `@/lib/checkout` (not directly from cart UI to Mercado Pago).

```bash
# .env.local — Payload + Mercado Pago
CHECKOUT_PROVIDER=mercado-pago
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxxxxxx
MERCADOPAGO_SANDBOX=true
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

```bash
curl -s http://localhost:3000/api/checkout   # provider + configured
```

Details: [docs/checkout/operations.md](./docs/checkout/operations.md).


## Deploy (Google Cloud VM)

Same-VM production: nginx → storefront (:3000) + CMS (:4000), Postgres in Docker.

```bash
sudo ./deploy/gce/deploy.sh bootstrap
sudo ./deploy/gce/deploy.sh configure --shop-host shop.example.com --cms-host cms.example.com
# edit /etc/tienda-magico/*.env
sudo ./deploy/gce/deploy.sh db-up
sudo ./deploy/gce/deploy.sh deploy
```

Full guide: [docs/deploy/gce.md](./docs/deploy/gce.md).

## Documentation

- [Docs home](./docs/README.md)
- [Commerce developer guide](./docs/commerce/developer.md)
- [Shopify content & merchandising guide](./docs/commerce/content.md)
- [Payload Ecommerce provider](./docs/commerce/payload-ecommerce.md)
- [Payload content & merchandising](./docs/commerce/payload-content.md)
- [Checkout developer guide](./docs/checkout/developer.md)
- [Checkout operations (Mercado Pago)](./docs/checkout/operations.md)
- [GCE VM deploy](./docs/deploy/gce.md)
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
npm run deploy:gce   # ./deploy/gce/deploy.sh (see docs)
```

## Localization status

| Layer | EN / ES |
| --- | --- |
| Storefront UI (`next-intl`) | Yes |
| Payload CMS catalog content | Yes (`en` / `es`, fallback to `en`) |
