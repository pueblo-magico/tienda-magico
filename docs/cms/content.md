# CMS homepage & pages — content guide

How editors build the **Pueblo Mágico homepage** (and other marketing pages) in Payload Admin.

Admin (local): [http://localhost:4000/admin](http://localhost:4000/admin)

Developer reference: [developer.md](./developer.md)  
Shop catalog (products/categories): [payload-content.md](../commerce/payload-content.md)

---

## What the homepage needs

The storefront loads a **published Page** whose **slug** is:

```text
home
```

(Change only if engineering set `CMS_HOME_PAGE_SLUG`.)

| Requirement | Detail |
| --- | --- |
| Collection | **Pages** |
| Slug | `home` (same for EN and ES — do not localize the slug) |
| Status | **Published** |
| Layout | One or more **blocks** (see recommended order below) |
| Locales | Fill English and Español fields |

If the page is missing, draft, or has no blocks, visitors see a **fallback** homepage (static translations). That is intentional for development — it is not the final branded page.

---

## Before you start

1. CMS is running (`npm run dev:cms` from repo root)
2. You can sign in as **admin**
3. Upload key images under **Media** (set **Alt** text in EN and ES)
4. For product/category sections: publish **Products** and **Categories** in the shop area (and ensure the storefront commerce provider points at this CMS or Shopify)

---

## Recommended homepage structure

Add blocks on the Home page **in this order** (Phase 7):

| # | Block | Section intent |
| --- | --- | --- |
| 1 | **Hero** | Primary headline + CTAs |
| 2 | **Featured categories** | Shop collections strip |
| 3 | **Featured products** | Best sellers / picks |
| 4 | **Info section** | Brand story |
| 5 | **Impact stats** | Impact numbers |
| 6 | **Newsletter** | Email capture |

Optional extras anywhere it fits: **CTA**, **Gallery**, **Testimonials**, **FAQ**.

---

## Create or edit the home page

1. Admin → **Content** → **Pages**
2. Create page (or open existing Home)
3. **Title** — e.g. `Home` (can differ by locale)
4. **Slug** — `home` (sidebar; shared across languages)
5. **Layout** — Add block → choose type → fill fields
6. Switch locale (EN / ES) and translate localized fields
7. **SEO** group (optional) — title, description, share image
8. **Publish**

Repeat publish after each meaningful edit so the storefront can read the new version.

---

## Block field guide

### Hero

| Field | Tips |
| --- | --- |
| Eyebrow | Short uppercase line above the title |
| Title | Main headline |
| Subtitle | Supporting sentence |
| Body | Optional rich text |
| Media | Hero image from Media |
| Media position | `Background` for full-bleed; `Right`/`Left` for split layout; `None` for text only |
| Actions | Up to 2 buttons (Shop, Impact, …) |

**Links**

- **Internal path** — site path without locale, e.g. `/shop`, `/about` (storefront adds `/en` or `/es`)
- **Custom URL** — full URL or any path you need
- **Appearance** — Primary / Secondary / Ghost / Link

### Featured categories

| Field | Tips |
| --- | --- |
| Title / description | Section header copy |
| Selection | **Manual** pick or **Latest** from shop categories |
| Categories | When manual — select category docs |
| Limit | Max cards (default 4) |

Categories must exist and be meaningful in the catalog. Cards link toward the shop with a collection query.

### Featured products (best sellers)

| Field | Tips |
| --- | --- |
| Selection | **Manual products** or **By category** |
| Products | Prefer products that have gallery + price + **Published** |
| Category | When “by category” — pick one category |
| Limit | Default 4 |

Storefront resolves products through the commerce layer (Payload or Shopify). Unpublished or mis-slugged products will not show.

### Info section (story)

| Field | Tips |
| --- | --- |
| Title + body | Brand story |
| Media | Optional photo |
| Layout | Text + media, Media + text, or Centered text |
| Link | Optional “About us” style CTA |

### Impact stats

| Field | Tips |
| --- | --- |
| Stats | 1–6 items |
| Value | Display string (`120+`, `3k`, `1%`) — not only numbers |
| Label | Short name of the metric |
| Description | Optional one-liner |

### Newsletter

| Field | Tips |
| --- | --- |
| Title / description | Why subscribe |
| Placeholder / button label | Localized UI strings |
| Success message | After submit |
| Form id | Optional external list id (engineering wires provider later) |

The form UI is live on the site; email provider integration may still be pending.

### CTA

Standalone band for campaigns. Use **Style**: Brand / Sand / Outline.

### Gallery

Image grid with optional captions. Set **Columns** 2–4.

### Testimonials

| Selection | Behaviour |
| --- | --- |
| Manual pick | Choose **Testimonials** entries |
| Latest published | Pull newest published quotes |

Create quotes under **Content → Testimonials** (quote, name, role, optional avatar/rating) and **Publish**.

### FAQ

| Selection | Behaviour |
| --- | --- |
| Manual | Pick FAQ docs |
| By category | Match FAQ **category** text (e.g. `shipping`) |
| All published | Full list |

Create entries under **Content → FAQs**.

---

## Localization checklist (EN / ES)

- [ ] Page title translated
- [ ] Every block’s visible text filled in both locales
- [ ] Button labels translated
- [ ] Media **Alt** translated
- [ ] SEO title/description per locale when used
- [ ] Slug stays `home` in both locales
- [ ] Both locales published as needed

---

## SEO on the home page

Optional **SEO** group on the page:

| Field | Use |
| --- | --- |
| Title | Browser / OG title override |
| Description | Meta description |
| Image | Social share image |
| noIndex | Rarely for home — keep off for production |

Los valores de **Globals → SEO defaults** se aplican al storefront; los metadatos específicos de cada página o producto tienen prioridad. Consultá [configuración pública](site-settings.md).

---

## Globals (not homepage blocks)

These are edited under **Globals** in admin. They do **not** replace homepage blocks today; header/footer of the storefront may still use code config until wired:

| Global | Purpose |
| --- | --- |
| Header | Nav items, optional CTA, logo |
| Footer | Tagline, link columns, legal |
| Site settings | Site name, contact, social |
| SEO defaults | Fallback title template, default OG |

---

## Preview & QA

1. Publish Home
2. Open storefront [http://localhost:3000/en](http://localhost:3000/en) and `/es`
3. Confirm block order and images
4. Click each CTA (locale prefix should be correct)
5. Confirm product/category cards only show published catalog items
6. Hard-refresh if you edited in the last minute (content may cache ~60s)

---

## Common mistakes

| Mistake | Result |
| --- | --- |
| Slug not exactly `home` | Fallback homepage |
| Left as Draft | Fallback homepage |
| Empty layout | Fallback homepage |
| Internal link `/es/tienda` | Double locale risk — use the internal path `/shop`; the storefront localizes it |
| Product block but catalog empty | Section missing |
| Image without Alt | Accessibility issues |
| Only EN filled | ES shows English fallback or empty strings |

---

## Other pages (same system)

Any **Pages** entry with a unique **slug** can use the same blocks. Engineering can attach routes (e.g. `/about` → slug `about`) using the same renderer. Until a route exists, the page is only visible in Admin.

---

## Need shop catalog help?

Products, variants, prices, and categories: [Payload content & merchandising](../commerce/payload-content.md)
