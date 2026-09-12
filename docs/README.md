# Pueblo Mágico documentation

Project docs for engineers and content/commerce operators.

| Audience | Guide | Description |
| --- | --- | --- |
| Developers | [Commerce developer guide](./commerce/developer.md) | Architecture, env setup, API usage, provider swapping |
| Developers | [Payload Ecommerce provider](./commerce/payload-ecommerce.md) | Self-hosted Payload adapter, env, carts, monorepo CMS |
| Developers | [CMS content developer guide](./cms/developer.md) | Homepage/pages via `@/lib/cms`, blocks, fallback, caching |
| Developers / content | [Storefront navigation](./navigation.md) | Shop routes and links to the main Experiencia Mágico website |
| Developers | [Checkout developer guide](./checkout/developer.md) | Provider-agnostic checkout, Mercado Pago, HTTP API |
| Operators | [Checkout operations guide](./checkout/operations.md) | MP credentials, sandbox, webhooks, go-live |
| Content / merchandising | [Shopify content guide](./commerce/content.md) | Products & collections in Shopify |
| Content / merchandising | [Payload catalog guide](./commerce/payload-content.md) | Products & categories in `apps/cms` |
| Content / editors | [CMS homepage & pages guide](./cms/content.md) | Build the home page with layout blocks (EN/ES) |
| Developers / DevOps | [Automated staging deployment](./deploy/github-actions.md) | GitHub Environment, SSH, Caddy, release, and rollback runbook |
| Developers / DevOps | [`apps/cms` README](../apps/cms/README.md) | Run Payload + Postgres locally, import map, and CMS development |

Related:

- Ecommerce implementation tasks: [Feature-based Codex prompts and definitions of done](./plans/ecommerce/README.md)
- Product roadmap / build plan: [`COMMAND.md`](../COMMAND.md)
- Environment template: [`.env.example`](../.env.example)
- Design system preview: `/ui-system` when the storefront is running

## Monorepo at a glance

| Path | Role | Port |
| --- | --- | --- |
| `/` | Next.js storefront | `3000` |
| `apps/cms` | Payload CMS + Ecommerce | `4000` |
| Postgres (CMS compose) | Database | `5433` |

```bash
npm run dev          # storefront
npm run db:cms:up    # CMS database
npm run dev:cms      # CMS admin + API
```

## Content vs commerce vs checkout (quick map)

| Need | System | Docs |
| --- | --- | --- |
| Homepage sections, stories, FAQs | Payload **Pages** + blocks | [cms/content.md](./cms/content.md) |
| Products, carts | `@/lib/commerce` | [commerce/developer.md](./commerce/developer.md) |
| Edit products in admin | Shopify or `apps/cms` shop | [commerce/content.md](./commerce/content.md) / [payload-content.md](./commerce/payload-content.md) |
| Pay with Mercado Pago (Payload carts) | `@/lib/checkout` + MP token in `.env.local` | [checkout/operations.md](./checkout/operations.md) |
| Pay with Shopify Checkout | `CHECKOUT_PROVIDER=commerce-redirect` | [checkout/developer.md](./checkout/developer.md) |
| Deploy shop + CMS to staging or production | GitHub Actions | [deploy/github-actions.md](./deploy/github-actions.md) |
