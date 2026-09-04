# 01 — Catalog ownership and migration foundation

Status: implemented for PMG-218; user reports successful manual testing on mobile, EN/ES, and cart reload after the final cart fix. Remaining verification details are listed below. Dependencies: none. Foundation details: `docs/commerce/catalog-model.md`.

Manual review: [human test checklist and results](01-catalog-contracts-manual-test.md). Confirmed checks are distinguished from scenarios not explicitly reported.

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
- Preserve current URLs and locale navigation: products and categories each have one stable slug shared between EN/ES. Translating or renaming content must not change it. Use the existing UI primitives and tokens; this is functional integration, not a redesign. Document any existing locale-switch selection behavior rather than inventing new routes.

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

### Verification evidence

- User acceptance: manual testing successful on mobile, in EN/ES, and with cart reload after the final 409 fix.
- Automated: 19 catalog/selection tests pass, including ID-only mutation responses, missing relationships, private-field exclusion, and saved-cart compatibility.
- Live local HTTP: simple/variant adds, quantity changes, and removal return 200; deleted-product cart recovery and local image optimization were also verified.
- Checks: storefront and CMS builds passed during implementation; type validation and targeted lint passed after the cart fix. Full CMS lint has two pre-existing frontend link errors and 13 warnings; storefront lint previously reported seven unrelated warnings. Formatting and diff checks passed.
- CMS editor guidance and generated type comments were updated without persisted schema or slug changes. No database migration was required.
- Not separately confirmed: desktop/keyboard coverage, the complete CMS-edit/cache-to-page sequence, and every availability/privacy manual scenario. Keep their checklist entries open rather than infer coverage from the reported successful manual test.
- Automated browser verification was unavailable because `agent-browser` was not installed. User-reported manual results are independent evidence, not automated browser results.
- Checkout stock warnings, reservations, payment completion, and production role-based access verification are not part of this acceptance; inventory/checkout protection remains deferred to tasks 06–07.

### Out of scope

New catalog fields beyond foundation, stock ledger, promotions, currency conversion, and production data changes.
