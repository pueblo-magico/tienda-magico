# 01 — Catalog ownership and migration foundation

Status: in progress for PMG-218; adapter and storefront selection fixes implemented, end-to-end verification pending. Dependencies: none. Foundation details: `docs/commerce/catalog-model.md`.

Manual review: [human test checklist](01-catalog-contracts-manual-test.md) (not yet executed).

## Codex implementation prompt

Implement the catalog foundation for the agreed ecommerce roadmap. Read and follow `docs/plans/ecommerce/README.md`, including its mandatory execution contract.

### Feature request

Establish how products, simple sellable items, variants, public catalog data, and private operations fit the existing Payload plugin. Product owns shared content; the sellable item owns SKU, price, stock identity, and shipping characteristics. Avoid two independently editable copies on parent and variant.

Inspect installed plugin collection overrides, generated schema, adapter mappers, carts, and domain contracts. Choose a plugin-compatible representation for simple products. Preserve existing product/variant IDs and cart references where possible; if conversion is necessary, document and test remapping. Do not introduce a hidden default variant unless its creation, uniqueness, cart mapping, and migration are supported.

Document field ownership, public/private boundaries, stable option IDs, preservation of the currently implemented slug concept, ARS money representation, and derived fields in `docs/commerce/catalog-model.md`. Add only foundational types/helpers needed by the chosen model, not speculative implementations of later features. Inventory and pricing remain on their existing authoritative path until their migration tasks execute.

### Required storefront representation

- Product detail: wire the existing variant selector to stable option type/value IDs, not translated labels. Display localized labels while resolving the selected sellable item by identity; duplicate or renamed labels must not select the wrong variant. Preserve compatibility with other providers through the commerce contract.
- Simple products: use the existing purchase controls without showing an artificial variant selector. Add the product-owned sellable item to the cart.
- Variant products: show the selected variant's ARS price and availability, disable unavailable or invalid combinations, and submit its opaque merchandise reference. Missing variant data must not fall back to purchasing the parent product.
- Product cards/listings: consume the authoritative price range and availability rather than a competing parent-price calculation. Do not expose exact inventory or private data.
- Cart: show the correct public product title and selected option labels, keep different variants as separate lines, and preserve identity through quantity changes and reloads. Surface stale/ambiguous merchandise failures with a localized, actionable message instead of silently substituting an item.
- Preserve current URLs, slug behavior, and locale navigation. Use the existing UI primitives and tokens; this is functional integration, not a redesign. Document any existing locale-switch selection behavior rather than inventing new routes.

### Definition of done

- [x] Installed plugin capabilities and simple/variant ownership decision are documented with actual repository paths.
- [x] Existing simple and multi-variant products still resolve to the correct cart merchandise identifier.
- [x] Public catalog types contain no purchasing/private operational fields.
- [x] Stable IDs and option identities are independent of EN/ES display labels.
- [x] Migration sequencing and compatibility strategy cover current products, variants, and saved carts.
- [x] Tests cover simple product, multi-variant product, missing relationship, and missing translation behavior.
- [x] Storefront selectors actually consume stable IDs; tests cover translated, renamed, and duplicate display labels.
- [ ] Simple and variant product pages, listing cards, and cart render the authoritative prices/availability and submit the correct merchandise references.
- [ ] A CMS fixture edit is verified through the public adapter, rendered product page, add-to-cart action, and cart reload in EN/ES. Record the cache refresh/revalidation behavior used.
- [ ] Desktop/mobile, keyboard interaction, missing variants, unavailable stock, and actionable cart failure states are verified; the manual checklist records results or explicit blockers.
- [ ] Shared execution checks pass for the complete integration or specific blockers are recorded; adapter-only tests do not establish feature completion.

Automated verification only: 16 catalog/selection regression tests pass; storefront production build/type
validation passes; lint passes with seven warnings in unrelated files; touched
source/test files pass targeted lint. Formatting and diff whitespace checks pass.
No live CMS mutation, browser checkout, or role-based CMS access test was performed;
HTTP integration is fixture-tested. CMS schema is unchanged. The storefront
selector now consumes stable IDs and uses the shared Button; invalid combinations
cannot be purchased. The prescribed browser command was unavailable, so visual
and CMS-edit-to-cart checks remain pending.

### Out of scope

New catalog fields beyond foundation, stock ledger, promotions, currency conversion, and production data changes.
