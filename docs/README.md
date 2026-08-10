# Pueblo Mágico documentation

Project docs for engineers and content/commerce operators.

| Audience | Guide | Description |
| --- | --- | --- |
| Developers | [Commerce developer guide](./commerce/developer.md) | Architecture, env setup, API usage, provider swapping |
| Developers | [Payload Ecommerce provider](./commerce/payload-ecommerce.md) | Self-hosted Payload adapter, env, carts, monorepo CMS |
| Content / merchandising | [Shopify content guide](./commerce/content.md) | Products & collections in Shopify |
| Content / merchandising | [Payload content guide](./commerce/payload-content.md) | Products & categories in `apps/cms` |
| Developers / DevOps | [`apps/cms` README](../apps/cms/README.md) | Run Payload + Postgres, import map, same-VM deploy |

Related:

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
