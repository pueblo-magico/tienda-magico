# Payload content & merchandising guide

How to manage catalog content in the self-hosted CMS (`apps/cms`) for the Pueblo Mágico storefront.

Admin: `http://localhost:4000/admin` (local default)

Developer/adapter reference: [payload-ecommerce.md](./payload-ecommerce.md)

---

## Before you start

1. CMS is running (`npm run dev:cms` from repo root)
2. You have an **admin** user
3. Storefront points at Payload:

```bash
COMMERCE_PROVIDER=payload
PAYLOAD_ECOMMERCE_URL=http://localhost:4000
```

---

## Recommended content order

1. **Media** — upload product images (set **Alt** text)
2. **Categories** — create shop groupings (`title` + unique `slug`)
3. **Products** — create items, attach gallery + category, set price
4. **Publish** — drafts are not visible to the public storefront API
5. (Optional) **Variants** — sizes/options when enabled on a product

---

## Categories

Used by the storefront as “collections” (`PAYLOAD_ECOMMERCE_COLLECTIONS_SLUG=categories`).

| Field | Guidance |
| --- | --- |
| Title | Display name (e.g. Ritual Cacao) |
| slug | URL key, unique, lowercase-kebab (e.g. `ritual-cacao`) |
| Description | Optional plain text |
| Image | Optional cover from Media |

---

## Products

### Required for a usable storefront card/PDP

| Field | Notes |
| --- | --- |
| Title | Product name (admin list title) |
| slug | Unique handle; storefront resolves `/product/[slug]` style routes by this |
| Price (USD) | Plugin price field — stored in **cents** (e.g. `2500` = $25.00) |
| Status | **Published** to appear in public API |

### Strongly recommended

| Field | Notes |
| --- | --- |
| Summary | Short plain text for product cards |
| Description | Rich text for PDP body |
| Gallery | One or more images |
| Category | Link to a category |
| Inventory | When not using variants |
| Tags | Optional labels |

### Draft vs published

- **Draft** → admin only (storefront adapter requests non-draft / published)
- **Published** → visible via REST to the storefront

Always publish after reviews.

### Variants

If **Enable variants** is on:

1. Define variant types/options in admin as prompted by the plugin
2. Create variant rows with their own price/inventory
3. Storefront line items should use the **variant id** as `merchandiseId` when adding to cart

Simple products (no variants): storefront can use the **product id**.

---

## Media

- Upload under **Media**
- Fill **Alt** (accessibility + SEO)
- Prefer web-friendly sizes; CMS can use Sharp for transforms when configured

Public URL pattern (local):

```text
http://localhost:4000/api/media/file/<filename>
```

---

## Carts & checkout (editorial note)

Editors usually do not manage carts. Carts are created by the storefront.

- Guest carts are enabled
- Checkout payment (Stripe) is **not** configured in CMS yet
- Storefront `checkoutUrl` currently points at the shop checkout path with `?cart=`

---

## Localization

**CMS content is single-language today.**

Storefront chrome (buttons, nav) is EN/ES via `next-intl`, but product title/description are not localized in Payload yet.

Until localization ships:

- Write catalog copy in the primary launch language, or
- Keep parallel fields manually (not recommended)

---

## Quality checklist before launch

- [ ] Every live product is **Published**
- [ ] Every product has a unique **slug**
- [ ] Price is correct in **cents**
- [ ] At least one gallery image with alt text
- [ ] Category assigned where navigation needs it
- [ ] Inventory realistic (or variants covered)
- [ ] Spot-check REST: `GET /api/products?draft=false`
- [ ] Spot-check storefront with `COMMERCE_PROVIDER=payload`

---

## Common mistakes

| Mistake | Result |
| --- | --- |
| Left as Draft | Product missing from shop |
| Price entered as dollars in a cents field | 100× too cheap/expensive |
| Duplicate / missing slug | PDP lookup fails or collides |
| No published products | Empty catalog |
| Wrong `PAYLOAD_ECOMMERCE_URL` | Storefront cannot reach CMS |
