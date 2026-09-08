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

### Products with sizes: options are not sellable variants

For example, a product sold in 15g and 20g needs:

1. An option type such as **Size**, with option labels **15g** and **20g**.
   The option **code/value** is an identifier, not a price. Do not put prices there.
2. Enable variants on the product, select Size, and save the product.
3. In **Sellable variants — price and stock**, create a record for each size.
   Choose its option, enable ARS pricing, enter its selling price using the price
   control, and set available units.
4. **Publish each variant** as well as the product. Saving a draft is not enough.
5. Refresh the storefront after its existing 60-second product cache interval
   (a subsequent request may complete background revalidation).

The parent product price and stock do not replace variant prices and stock.
An empty variant list means there are no publicly available sellable records,
even if the Size options exist. The storefront cannot derive prices from option
codes. Existing codes are not automatically rewritten or converted to prices.

These editor guidance changes do not change stored fields, IDs, or slugs and
require no database migration. Existing draft variants remain unpublished.

1. **Media** — upload product images (set **Alt** text)
2. **Categories** — create shop groupings (`title` + unique `slug`)
3. **Products** — create items, attach gallery + category, set price
4. **Publish** — drafts are not visible to the public storefront API
5. (Optional) **Variants** — sizes/options when enabled on a product

---

## Categories

Used by the storefront as “collections” (`PAYLOAD_ECOMMERCE_COLLECTIONS_SLUG=categories`).

| Field       | Guidance                                               |
| ----------- | ------------------------------------------------------ |
| Title       | Display name (e.g. Ritual Cacao)                       |
| slug        | URL key, unique, lowercase-kebab (e.g. `ritual-cacao`) |
| Description | Optional plain text                                    |
| Image       | Optional cover from Media                              |

---

## Products

### Descripción corta y descripción completa

- **Descripción corta** (`summary`): texto sin formato junto al precio y los controles de compra. Si está vacía, se omite; no se recorta automáticamente la descripción completa.
- **Descripción completa** (`description`): contenido enriquecido dentro del acordeón **Descripción**. Conserva párrafos, títulos, listas, énfasis y enlaces permitidos. Si está vacía, se omite ese acordeón.
- Completá ambos campos en ES y EN. Se mantiene el fallback configurado del proveedor (español por defecto); no se cambia el slug al traducir.
- Publicá los cambios y esperá el intervalo de caché de productos de 60 segundos. Puede ser necesaria otra visita después de la revalidación en segundo plano.
- El ejemplo `/ui-system/typography` muestra el componente compartido. Los textos que contienen etiquetas HTML literales se escapan: no son una alternativa al editor enriquecido.

No se requiere migración: estos campos ya existían. Los proveedores sin un
resumen separado conservan la presentación breve anterior como compatibilidad.

### Secciones de información

En **Información adicional**, mantené las mismas claves y el mismo orden lógico
en ES y EN. Completá título y contenido por idioma, activá **Visible en la tienda**
solo para información pública y agregá filas personalizadas cuando haga falta.
Las filas sin título o contenido, y las ocultas, no se renderizan. La clave estable
(`ingredients`, `how-to-use`, `origin-impact`, `care`) identifica la sección; no la
uses para guardar notas internas ni datos de proveedores.

### Required for a usable storefront card/PDP

| Field       | Notes                                                                      |
| ----------- | -------------------------------------------------------------------------- |
| Title       | Product name (admin list title)                                            |
| slug        | Unique handle; storefront resolves `/product/[slug]` style routes by this  |
| Price (ARS) | Plugin price field — stored in **minor units** (e.g. `250000` = $2.500,00) |
| Status      | **Published** to appear in public API                                      |

### Strongly recommended

| Field       | Notes                              |
| ----------- | ---------------------------------- |
| Summary     | Short plain text for product cards |
| Description | Rich text for PDP body             |
| Gallery     | One or more images                 |
| Category    | Link to a category                 |
| Inventory   | When not using variants            |
| Tags        | Optional labels                    |

### Draft vs published

- **Draft** → admin only (storefront adapter requests non-draft / published)
- **Published** → visible via REST to the storefront

Always publish after reviews.

Publishing a product with variants enabled requires at least one linked,
published variant with ARS pricing enabled and a non-negative integer price in
minor units. Stock may be zero: sold-out products can remain published. Save new
products as drafts, create and publish their variants, then publish the parent.
Simple products require their own enabled, valid ARS price.

Deleting, unpublishing, moving, or invalidating the price of the last eligible
variant is blocked while its parent is published. Publish a replacement first,
or unpublish the parent. Switching to a simple product requires valid parent
pricing. Validation applies to admin and API writes; no database migration is
required. Existing misconfigured products are not automatically unpublished, but
their next published save must pass validation. The storefront displays
“Producto no disponible” / “Product unavailable” when no variant is selectable.

These are request-level editorial guards, not database constraints or a checkout
reservation mechanism. Simultaneous administrative edits are not serialized by
these hooks; avoid concurrent variant removal/publication operations on one
product. Checkout concurrency remains part of task 07.

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
- Checkout payment runs on the **storefront** via Mercado Pago (not inside CMS admin)
- Product **titles** (EN + ES) and images should be filled in — they appear on the cart and on the Mercado Pago preference
- Storefront `checkoutUrl` points at `/{locale}/checkout?cart=` which starts the payment session

Operators: [checkout operations](../checkout/operations.md).

---

## Localization (EN / ES)

The admin has a **locale switcher** (English / Español).

1. Enter the default locale (**English**) first
2. Switch to **Español** and translate:
   - Product: title, description, summary, tags
   - Category: title, description
   - Media: alt text
3. Keep **slug** the same (shared URL handle)
4. Publish when both locales are ready (fallback serves EN if ES is empty)

Storefront requests should pass the active locale, e.g. `commerce.getProducts({ locale: "es" })`.

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

| Mistake                                   | Result                       |
| ----------------------------------------- | ---------------------------- |
| Left as Draft                             | Product missing from shop    |
| Price entered as dollars in a cents field | 100× too cheap/expensive     |
| Duplicate / missing slug                  | PDP lookup fails or collides |
| No published products                     | Empty catalog                |
| Wrong `PAYLOAD_ECOMMERCE_URL`             | Storefront cannot reach CMS  |

---

## Content collections (Phase 6)

Beyond the shop catalogue, the CMS also manages marketing content.

| Collection       | Use for                                                 |
| ---------------- | ------------------------------------------------------- |
| **Pages**        | Homepage and static routes built from **layout blocks** |
| **Posts**        | Journal / stories                                       |
| **Testimonials** | Quotes pulled into Testimonials blocks                  |
| **FAQs**         | Q&A pulled into FAQ blocks                              |
| **Media**        | Shared uploads                                          |

### Globals

| Global            | Use for                             |
| ----------------- | ----------------------------------- |
| **Header**        | Nav items + optional header CTA     |
| **Footer**        | Columns of links + tagline          |
| **Site settings** | Site name, contact, social          |
| **SEO defaults**  | Fallback title/description/OG image |

### Building a page

1. **Pages → Create**
2. Set **Title** + **slug** (shared across EN/ES)
3. Add **layout** blocks (Hero, Featured products, Impact stats, …)
4. Fill **SEO** overrides if needed
5. Switch locale and translate localized fields
6. **Publish**

Homepage wiring on the storefront (Phase 7) loads a page by slug (e.g. `home`) and renders its blocks.

Full editor + developer guides: [CMS homepage content](../cms/content.md) · [CMS developer](../cms/developer.md).

---

## Homepage (Phase 7)

Storefront route `/[locale]` loads the **published** CMS page with slug `home` (override with `CMS_HOME_PAGE_SLUG`).

Recommended layout blocks (in order):

1. **Hero**
2. **Featured categories**
3. **Featured products** (best sellers)
4. **Info section** (story)
5. **Impact stats**
6. **Newsletter**

If the CMS is unreachable or the page is missing/empty, the storefront renders a localized fallback with the same section structure.

API: `GET /api/pages?where[slug][equals]=home&locale=en`

**Dedicated guides (start here for homepage work):**

- Editors → [CMS homepage & pages](../cms/content.md)
- Engineers → [CMS content developer guide](../cms/developer.md)
