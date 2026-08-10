# `@tienda-magico/cms`

Self-hosted **Payload CMS 3** backend with `@payloadcms/plugin-ecommerce`.

Runs as a **separate Next.js process** (default **port 4000**) next to the storefront (port 3000).  
Same git repository; same-VM deploy is supported.

Related storefront docs:

- [Payload Ecommerce adapter](../../docs/commerce/payload-ecommerce.md)
- [Commerce developer guide](../../docs/commerce/developer.md)
- [Payload content / merchandising](../../docs/commerce/payload-content.md)

## Stack

| Piece | Choice |
| --- | --- |
| CMS | Payload 3 (Next.js App Router admin) |
| Database | PostgreSQL (`@payloadcms/db-postgres`) |
| Ecommerce | `@payloadcms/plugin-ecommerce` |
| Catalog extras | `categories`, product `slug` / gallery / summary |
| Payments | Not wired yet (Stripe can be added later) |

## Ports

| Service | Default |
| --- | --- |
| CMS admin + API | `http://localhost:4000` |
| Admin UI | `http://localhost:4000/admin` |
| REST API | `http://localhost:4000/api` |
| Postgres (Docker Compose) | `localhost:5433` → container `5432` |
| Storefront | `http://localhost:3000` |

## Quick start

From **repo root**:

```bash
npm run db:cms:up      # Postgres via apps/cms docker compose
npm run dev:cms        # Payload on :4000
```

Or from `apps/cms`:

```bash
cp .env.example .env
npm install
npm run db:up
npm run dev
```

1. Open `http://localhost:4000/admin`
2. Create the **first admin user** when prompted
3. Add **Media**, **Categories**, **Products** (publish when ready)

### After config / plugin changes

Regenerate the admin component map if the dashboard complains about missing import map entries:

```bash
npm run generate:importmap
# then restart dev
```

Refresh TypeScript types after schema changes:

```bash
npm run generate:types
```

## Environment (`apps/cms/.env`)

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | e.g. `postgresql://postgres:postgres@127.0.0.1:5433/tienda_magico_cms` |
| `PAYLOAD_SECRET` | Yes | Long random string |
| `NEXT_PUBLIC_SERVER_URL` | Recommended | Public CMS URL (`http://localhost:4000`) |
| `PAYLOAD_PUBLIC_SERVER_URL` | Optional | Same as above if used |
| `CORS_ORIGINS` | Recommended | Comma-separated storefront origins (`http://localhost:3000`) |

Never commit `.env`.

## Collections (high level)

| Slug | Source | Purpose |
| --- | --- | --- |
| `users` | App | Admins/customers; API keys enabled |
| `media` | App | Public-read uploads |
| `categories` | App | Storefront “collections” listing |
| `products` | Ecommerce plugin + override | Catalog (draft/publish) |
| `variants` / variant types & options | Plugin | Product variants |
| `carts` | Plugin | Carts + item endpoints (`allowGuestCarts: true`) |
| `orders`, `addresses`, … | Plugin | Checkout domain (payments TBD) |

### Product fields we added

Plugin defaults do **not** include `title`. This app’s override adds:

- `title` (required) — also `admin.useAsTitle`
- `slug` (required, unique)
- `description` (rich text)
- `summary` (plain text for cards)
- `gallery[]` → `media`
- `category` → `categories`
- `tags[]`

Plus plugin fields: pricing (`priceInUSD` in minor units), inventory, variants, drafts.

## Localization status

**Not enabled yet.** Catalog content is single-locale.

- Storefront UI strings: EN/ES via `next-intl`
- CMS product copy: one language only (until Payload `localization` is configured)

Planned follow-up: Payload locales `en` / `es` + storefront adapter `?locale=`.

## Storefront connection

Root storefront `.env.local`:

```bash
COMMERCE_PROVIDER=payload
PAYLOAD_ECOMMERCE_URL=http://localhost:4000
PAYLOAD_ECOMMERCE_CURRENCY=USD
PAYLOAD_ECOMMERCE_AMOUNT_IS_CENTS=true
PAYLOAD_ECOMMERCE_COLLECTIONS_SLUG=categories
# Optional — Users collection API key for server-side reads/writes
# PAYLOAD_ECOMMERCE_API_KEY=...
# PAYLOAD_ECOMMERCE_API_KEY_COLLECTION=users
```

Full adapter reference: [docs/commerce/payload-ecommerce.md](../../docs/commerce/payload-ecommerce.md).

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server `:4000` |
| `npm run build` / `start` | Production |
| `npm run db:up` / `db:down` / `db:logs` | Local Postgres Compose |
| `npm run generate:importmap` | Fix missing admin components |
| `npm run generate:types` | Refresh `src/payload-types.ts` |
| `npm run payload` | Payload CLI |

Root convenience scripts: `dev:cms`, `build:cms`, `start:cms`, `db:cms:up`, `db:cms:down`.

## Same-VM deploy sketch

```text
reverse proxy
  shop.example.com  → 127.0.0.1:3000   storefront
  cms.example.com   → 127.0.0.1:4000   this app (/admin + /api)
Postgres            → private bind or 127.0.0.1:5433
```

Process managers: `systemd`, PM2, or Docker (optional `Dockerfile` + Compose Postgres service).

Set `CMS_STANDALONE_OUTPUT=true` when building the optional standalone Docker image.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `useAsTitle` / missing `title` on products | Ensure products override includes `title` (already in `src/collections/Products.ts`) |
| `getFromImportMap: PayloadComponent not found` | `npm run generate:importmap` + restart |
| DB connection errors | `npm run db:up`, check `DATABASE_URL` port **5433** |
| CORS errors from browser | Add storefront origin to `CORS_ORIGINS` |
| Empty catalog on storefront | Publish products (`_status: published`), confirm `COMMERCE_PROVIDER=payload` |
| Guest cart 403 | Guest carts need secret; storefront uses `cartId::secret` |

## Notes

- Prefer **server-side** storefront calls to Payload (adapter already does this).
- Media is public-read; product **drafts** are admin-only until published.
- Stripe / payment adapters are intentionally omitted until checkout work.
