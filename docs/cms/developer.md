# CMS content developer guide (homepage & pages)

How the **storefront** loads marketing content from **Payload CMS** (`apps/cms`).

This is separate from the commerce catalog adapter (`@/lib/commerce`), though both can point at the same Payload process.

Related:

- Content editor workflow → [content.md](./content.md)
- CMS app ops → [apps/cms README](../../apps/cms/README.md)
- Catalog merchandising → [payload-content.md](../commerce/payload-content.md)
- Commerce layer → [developer.md](../commerce/developer.md)

---

## Goals

- Drive `/[locale]` (and future pages) from CMS **Pages + layout blocks**
- Keep block rendering in the storefront (design system), schema in Payload
- Support EN/ES via Payload `locale` + next-intl routing
- Degrade gracefully when CMS is offline or the home page is unpublished

---

## Architecture

```text
Browser  →  Next.js storefront (:3000)
                │
                ├─ src/app/[locale]/page.tsx
                │       │
                │       ├─ getHomePage(locale)     @/lib/cms
                │       │       │
                │       │       └─ REST  →  apps/cms (:4000)  /api/pages
                │       │
                │       └─ RenderBlocks            @/features/cms
                │               │
                │               ├─ pure content blocks (Hero, CTA, …)
                │               └─ commerce-backed blocks
                │                       └─ @/lib/commerce (products / categories)
                │
                └─ FallbackHome  (if CMS missing / empty layout)
```

| Layer   | Path                                | Role                                        |
| ------- | ----------------------------------- | ------------------------------------------- |
| Route   | `src/app/[locale]/page.tsx`         | Load home page, metadata, fallback          |
| CMS API | `src/lib/cms/*`                     | Config, fetch, media URLs, rich text        |
| UI      | `src/features/cms/*`                | `RenderBlocks`, block views, `FallbackHome` |
| Schema  | `apps/cms/src/collections/Pages.ts` | Page + `layout` blocks                      |
| Blocks  | `apps/cms/src/blocks/*`             | Payload block field definitions             |

**Rules**

- Feature/UI code imports `@/lib/cms` and `@/features/cms` for content — not raw Payload admin URLs in components.
- Product/category data still goes through `@/lib/commerce` (provider-agnostic).
- Do not import `apps/cms` TypeScript into the storefront bundle.

---

## Environment

Storefront `.env.local` (see root `.env.example`):

| Variable                         | Required | Default / notes                                     |
| -------------------------------- | -------- | --------------------------------------------------- |
| `PAYLOAD_CMS_URL`                | No*      | CMS base URL. Falls back to `PAYLOAD_ECOMMERCE_URL` |
| `PAYLOAD_ECOMMERCE_URL`          | No*      | Shared monorepo default `http://localhost:4000`     |
| `PAYLOAD_CMS_API_KEY`            | No       | Falls back to `PAYLOAD_ECOMMERCE_API_KEY`           |
| `PAYLOAD_CMS_API_KEY_COLLECTION` | No       | Default `users`                                     |
| `PAYLOAD_CMS_API_PREFIX`         | No       | Default `/api`                                      |
| `PAYLOAD_CMS_DEPTH`              | No       | Default `2` (relationship populate)                 |
| `PAYLOAD_CMS_DEFAULT_LOCALE`     | No       | Default `en`                                        |
| `PAYLOAD_CMS_FALLBACK_LOCALE`    | No       | Default `en`                                        |
| `CMS_HOME_PAGE_SLUG`             | No       | Default `home`                                      |

\* At least one of `PAYLOAD_CMS_URL` or `PAYLOAD_ECOMMERCE_URL` must be set for `isCmsConfigured()` to be true.

```bash
# Typical monorepo local setup
PAYLOAD_ECOMMERCE_URL=http://localhost:4000
CMS_HOME_PAGE_SLUG=home
COMMERCE_PROVIDER=payload   # optional; needed for product/category blocks
```

`isCmsConfigured()` only checks that a base URL exists. Commerce blocks additionally need `commerce.isConfigured()`.

---

## Public storefront API (`@/lib/cms`)

```ts
import {
  isCmsConfigured,
  getHomePage,
  getPageBySlug,
  getTestimonials,
  getFaqs,
  resolveMediaUrl,
  richTextToHtml,
} from "@/lib/cms";
```

| Helper                               | Purpose                                       |
| ------------------------------------ | --------------------------------------------- |
| `isCmsConfigured()`                  | Base URL present                              |
| `getHomePage(locale?)`               | Published page for `CMS_HOME_PAGE_SLUG`       |
| `getPageBySlug(slug, locale?)`       | Any published page by shared slug             |
| `getTestimonials` / `getFaqs`        | Block helpers when relationships are ids only |
| `resolveMediaUrl` / `mediaAlt`       | Absolute media URLs against CMS origin        |
| `richTextToHtml` / `richTextToPlain` | Lexical JSON helpers                          |
| `cmsFetch`                           | Low-level REST (prefer higher-level helpers)  |

### Fetch behaviour

- Adds `locale` and `fallback-locale` query params (Payload localization).
- Home/page queries filter `_status = published`.
- Uses Next.js `next: { revalidate: 60, tags: [...] }` for ISR-style caching.
- Throws `CmsError` on network/HTTP failures; the homepage route catches and falls back.

Example REST equivalent:

```http
GET /api/pages?where[slug][equals]=home&where[_status][equals]=published&limit=1&depth=2&locale=en&fallback-locale=en
```

---

## Homepage route

File: `src/app/[locale]/page.tsx`

1. `setRequestLocale(locale)`
2. If CMS configured → `getHomePage(locale)`
3. If `page.layout` has blocks → `<RenderBlocks blocks={…} locale={locale} />`
4. Else → `<FallbackHome locale={locale} />`
5. `generateMetadata` reads page `seo` (title, description, OG image, noIndex)

### Fallback home

`src/features/cms/FallbackHome.tsx` mirrors Phase 7 section intent using:

- `messages/*.json` → `home` + `homeSections`
- Optional live catalog via `commerce.getProducts` / `getCollections` when commerce is configured

This keeps local UI work unblocked without a published CMS page.

---

## Block renderer

`RenderBlocks` maps each Payload `blockType` to a React view:

| `blockType`          | View                          | Notes                                             |
| -------------------- | ----------------------------- | ------------------------------------------------- |
| `hero`               | `HeroBlockView`               | Media positions: background / left / right / none |
| `cta`                | `CtaBlockView`                | Styles: brand / sand / outline                    |
| `infoSection`        | `InfoSectionBlockView`        | Story-style section + optional link               |
| `gallery`            | `GalleryBlockView`            | 2–4 columns                                       |
| `testimonials`       | `TestimonialsBlockView`       | Manual relations or latest published              |
| `faq`                | `FaqBlockView`                | Manual / category / all + Accordion               |
| `newsletter`         | `NewsletterBlockView`         | Client form UI; provider hookup TBD (`formId`)    |
| `featuredProducts`   | `FeaturedProductsBlockView`   | Uses `@/lib/commerce`                             |
| `featuredCategories` | `FeaturedCategoriesBlockView` | Uses `@/lib/commerce`                             |
| `impactStats`        | `ImpactStatsBlockView`        | Stat cards                                        |

Unknown `blockType` values are skipped (safe forward-compat).

### Links

Payload link groups (`type: custom | internal`, `url` / `path`, `appearance`) render via `CmsLinkButton`:

- **internal** `path` is locale-prefixed: `/shop` → `/{locale}/shop`
- **custom** `url` used as-is (absolute or path)
- `appearance` maps to design-system `Button` variants

### Rich text

Lexical JSON from Payload is rendered with a small HTML converter (`richTextToHtml`) inside `RichText`. Prefer this over dumping JSON in the UI. Extend carefully if you enable more Lexical features in CMS.

### Media / images

- URLs are resolved to the CMS origin (`http://localhost:4000/...`).
- Storefront `next.config.ts` allows `localhost:4000` media and Shopify CDN hosts.
- Always set **Alt** on Media docs for a11y.

---

## Commerce-backed blocks

These blocks need a configured commerce provider (`COMMERCE_PROVIDER` + credentials):

**Featured products**

- `selection: manual` → resolve by product `slug` (handle) or id against `commerce.getProducts` / `getProduct`
- `selection: category` → `commerce.getCollection(handle, { productsFirst, locale })`
- Empty / errors → block renders nothing

**Featured categories**

- Manual pick by category id/slug or latest via `commerce.getCollections`
- Links to `/{locale}/shop?collection={handle}` (shop listing can consume the query in Phase 8)

When using Shopify as commerce and Payload as CMS content, homepage copy/blocks come from Payload while product cards come from Shopify — that split is intentional.

---

## Adding a new block

1. **CMS schema** — add `apps/cms/src/blocks/YourBlock.ts`, register in `blocks/index.ts` (`layoutBlocks`)
2. Restart CMS / push schema; run `npm run generate:types` in `apps/cms`
3. **Storefront type** — extend `src/lib/cms/types.ts` with `YourBlockData` + union member
4. **View** — `src/features/cms/blocks/YourBlockView.tsx`
5. **Switch** — case in `RenderBlocks.tsx`
6. Document fields in [content.md](./content.md)

Do not put presentation-only Tailwind decisions into Payload fields unless editors need control.

---

## Localization

| Concern            | Mechanism                                                      |
| ------------------ | -------------------------------------------------------------- |
| URL locale         | `next-intl` `/en`, `/es`                                       |
| CMS field locale   | REST `locale` + `fallback-locale`                              |
| Shared slug        | Page `slug` is **not** localized (same handle both languages)  |
| UI chrome fallback | `messages/en.json`, `messages/es.json`                         |
| Catalog locale     | Passed into `commerce.*` as `locale` when provider supports it |

Editors translate localized block fields in admin locale switcher; they must **Publish** each locale as required by your draft workflow.

---

## Caching & revalidation

Current helpers tag fetches (e.g. `cms-page-home`) with `revalidate: 60`.

To on-demand revalidate later:

```ts
// app/api/revalidate/route.ts (example — not required yet)
import { revalidateTag } from "next/cache";
revalidateTag("cms-page-home");
```

Product and media changes use a Payload hook to call the storefront catalog
revalidation endpoint. Configure `STOREFRONT_REVALIDATION_URL` in the CMS and the
same server-only `STOREFRONT_REVALIDATION_SECRET` in both applications. Failed
delivery does not block editing; the existing 60–120 second cache lifetime remains
the fallback. Never expose this secret through a `NEXT_PUBLIC_*` variable.

---

## Security

- Prefer server-only fetches (`@/lib/cms` in Server Components / route handlers).
- Optional API key stays in server env — never `NEXT_PUBLIC_*`.
- Public collections use `adminOrPublishedStatus` read access; drafts stay admin-only.
- `RichText` uses sanitized-ish escaping for text nodes; treat CMS users as trusted editors.

---

## Testing checklist

- [ ] CMS up on `:4000`, storefront on `:3000`
- [ ] `PAYLOAD_ECOMMERCE_URL` or `PAYLOAD_CMS_URL` set in storefront env
- [ ] Published page `slug=home` with at least a Hero block
- [ ] `/en` and `/es` show translated localized fields
- [ ] Unpublish / stop CMS → fallback home still renders
- [ ] Featured products/categories appear when commerce configured + data exists
- [ ] `npm run build` succeeds without CMS running
- [ ] SEO title/description from page `seo` group when set

---

## Troubleshooting

| Symptom                         | Likely cause                                                      |
| ------------------------------- | ----------------------------------------------------------------- |
| Always see fallback home        | No URL env; page draft; wrong slug; empty `layout`                |
| 404 / CMS errors in server logs | CMS down; CORS not required for server-side fetch; bad port       |
| Images broken                   | Media host not in `next.config` images; relative URL not resolved |
| Empty product block             | Commerce not configured; products draft; slug mismatch            |
| EN shows, ES missing copy       | Locale fields empty and fallback disabled/misconfigured           |
| Stale content ~1 min            | Expected with `revalidate: 60`                                    |

---

## Future routes

Reuse the same pattern for static pages:

```ts
const page = await getPageBySlug("about", locale);
return <RenderBlocks blocks={page?.layout} locale={locale} />;
```

El storefront consume `site-settings`, `header.logo` y `seo`. Los menús y el global `footer` siguen pendientes (TIENDA-18). Consultá [configuración pública](site-settings.md) para prioridades, caché y verificación.
