# Shopify content & merchandising guide

This guide is for content editors, merchandisers, and brand operators who manage the Pueblo Mágico catalog in **Shopify Admin**.

The website is headless: what you publish in Shopify is what the storefront can show and sell.

Developer setup details are in the [Commerce developer guide](./developer.md).

---

## What Shopify controls vs the website

| In Shopify Admin | On the website |
| --- | --- |
| Products, variants, prices, inventory | Product listing + product detail pages |
| Collections | Category / shop sections |
| Product media | Gallery images |
| Product title/description/SEO fields | PDP copy + metadata |
| Availability / stock | Add to cart enabled/disabled |
| Checkout configuration | Hosted checkout after cart |

Website-only content (story pages, journal, impact narrative, SEO landing pages) will primarily live in the CMS later.  
**Sellable catalog data should stay in Shopify.**

---

## Prerequisites

You need access to the Shopify store admin used by this project.

Ask engineering for:

- Admin URL (e.g. `https://admin.shopify.com/store/...`)
- Confirmation that the custom app Storefront token is installed
- Which theme/channel is considered the source of truth (Online Store channel should include products you want headless-visible)

---

## Product standards (Pueblo Mágico)

### Required fields

For every product:

1. **Title** — clear, customer-facing (`Organic Mountain Cacao`)
2. **Handle / URL handle** — stable, lowercase, hyphenated (`organic-mountain-cacao`)
3. **Description** — customer-ready story + usage notes
4. **Media** — at least 1 high-quality image
5. **Price** on each variant
6. **Status** = **Active**
7. **Sales channels** include the channel used by Storefront API (usually Online Store)

### Strongly recommended

- SEO title + description
- Product type (e.g. `Cacao`, `Wellness`, `Home`)
- Vendor/brand where relevant
- Tags for filtering/merchandising (`best-seller`, `ritual`, `limited`)
- Alt text on images
- Compare-at price only for true promotions

### Handles are permanent URLs

The website loads products by handle:

```text
/shop/[handle]  →  commerce.getProduct(handle)
```

Avoid renaming handles after launch. If you must rename, coordinate with engineering for redirects.

---

## Variants & options

Use variants for real purchasable differences:

- Size (`100g`, `250g`)
- Pack (`Single`, `Bundle`)
- Scent / format when needed

Guidelines:

- Keep option names consistent across catalog (`Size`, not `size` / `Tamaño` mixed randomly)
- Each variant needs its own price and inventory tracking decision
- SKU optional but useful for ops
- Default variant is fine for single-SKU products

The website add-to-cart flow uses the **variant ID**, not the product ID.

---

## Images & media

### Recommendations

- Primary image: clean product hero on neutral/brand background
- Additional images: lifestyle, scale, ingredients, ritual context
- Prefer square or consistent aspect ratios for grid cards
- Export optimized JPG/WebP-friendly assets (large enough for zoom, not multi‑MB unneeded originals)

### Alt text

Write descriptive alt text for accessibility and SEO:

- Good: `Brown pouch of Organic Mountain Cacao beside cacao pods`
- Avoid: `image1`, `final_final_v3`

### Featured image

The first/product image becomes the card image in listings (`featuredImage`).  
Put the strongest packshot first.

---

## Collections

Collections power grouped merchandising (e.g. Best Sellers, Rituals, New).

### Creating a collection

1. Shopify Admin → **Products** → **Collections**
2. Create collection
3. Choose **Manual** (curated) or **Automated** (rules/tags)
4. Set title, description, image
5. Ensure the collection is available on the storefront channel
6. Note the **handle** (used by the website)

### Suggested starter collections

| Collection | Purpose | Suggested rule/manual |
| --- | --- | --- |
| `best-sellers` | Homepage + shop highlight | Manual |
| `new` | Latest drops | Automated by create date or tag `new` |
| `rituals` | Ritual assortment | Tag `ritual` |
| `wellness` | Wellness category | Product type/tag |

### Collection handles

Same rule as products: keep handles stable.

---

## Inventory & availability

- If inventory tracking is enabled, keep stock accurate
- Out-of-stock variants should not be sellable unless you intentionally allow oversell
- The website reads `availableForSale` / variant availability from Storefront API

For launches:

1. Upload media + copy first as Draft
2. Set prices/inventory
3. Switch to Active
4. Verify on storefront after cache window (or ask eng to revalidate)

---

## Pricing & currency

- Enter prices in the store’s base currency configured in Shopify
- The website formats money with the currency code returned by Shopify
- Compare-at price should only be used for genuine discounts

---

## SEO fields in Shopify

For each product/collection:

- **Search engine listing title**
- **Meta description**

These map into the commerce `seo` fields and can feed Next.js metadata on PDP/collection pages.

Tips:

- Include primary keyword naturally
- Keep titles unique
- Describe benefit + product clearly in meta description

---

## Multilingual notes (EN / ES)

The website supports `/en` and `/es` routes.

Shopify catalog language strategy should be decided explicitly:

### Option A — single catalog language (simple)
- Keep Shopify product copy in one primary language (often EN)
- Translate storytelling pages in CMS / website messages
- Fastest operationally, weaker localized PDP copy

### Option B — Shopify Translate & Adapt / localized content
- Maintain translated product titles/descriptions in Shopify
- Requires storefront locale wiring in engineering (future enhancement if not already enabled)

Until locale-aware Storefront queries are fully wired for translated catalog resources, treat Shopify product copy as the default catalog language and coordinate with engineering before relying on per-locale PDP translations.

Website chrome (nav, buttons, footer) is already translated via `messages/en.json` and `messages/es.json`.

---

## Content workflow checklist (new product)

- [ ] Draft product created
- [ ] Title + durable handle set
- [ ] Description written (story, ritual use, sourcing)
- [ ] At least one strong image + alt text
- [ ] Variants/options priced
- [ ] Inventory set (if tracked)
- [ ] Tags/type assigned for collections/filters
- [ ] SEO title/description filled
- [ ] Added to relevant collections
- [ ] Status = Active + correct sales channel
- [ ] QA on website:
  - appears in intended collection/listing
  - PDP opens via handle
  - correct price/images
  - add to cart uses correct variant
  - checkout URL opens Shopify checkout

---

## QA scenarios for editors

### Product not showing on website

Check:

1. Status is Active
2. Product is published to the storefront/online channel
3. Handle matches expected URL
4. Storefront token app still installed
5. Ask eng if cache revalidation is needed

### Wrong image on cards

- Reorder media so the desired packshot is first
- Confirm no stale cache (eng can revalidate `products` / `product:{handle}`)

### Cannot add to cart

- Variant exists and is available for sale
- Inventory not zero (when tracking)
- Price present on variant

### Checkout broken

- Cart created successfully
- Shopify checkout/payments configured in Admin
- Payments test mode vs live mode expectations

---

## What not to manage in Shopify

Keep these out of product descriptions when possible (put in CMS/website later):

- Global navigation labels
- Long journal articles
- Impact page narrative modules
- Homepage layout blocks

Shopify product descriptions should stay focused on **buying decisions**.

---

## Handoff to engineering

When requesting storefront work, include:

- Product/collection handles
- Screenshots from Shopify Admin
- Expected page (`/en/shop`, PDP handle, homepage module)
- Whether the item is Active and published
- Any tags/collections used for targeting

---

## Related developer docs

→ [Commerce developer guide](./developer.md)
