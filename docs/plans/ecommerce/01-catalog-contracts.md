# 01 — Catalog ownership and migration foundation

Status: planned. Dependencies: none.

## Codex implementation prompt

Implement the catalog foundation for the agreed ecommerce roadmap. Read and follow `docs/plans/ecommerce/README.md`, including its mandatory execution contract.

### Feature request

Establish how products, simple sellable items, variants, public catalog data, and private operations fit the existing Payload plugin. Product owns shared content; the sellable item owns SKU, price, stock identity, and shipping characteristics. Avoid two independently editable copies on parent and variant.

Inspect installed plugin collection overrides, generated schema, adapter mappers, carts, and domain contracts. Choose a plugin-compatible representation for simple products. Preserve existing product/variant IDs and cart references where possible; if conversion is necessary, document and test remapping. Do not introduce a hidden default variant unless its creation, uniqueness, cart mapping, and migration are supported.

Document field ownership, public/private boundaries, stable option IDs, shared slugs, ARS money representation, and derived fields in `docs/commerce/catalog-model.md`. Add only foundational types/helpers needed by the chosen model, not speculative implementations of later features. Inventory and pricing remain on their existing authoritative path until their migration tasks execute.

### Definition of done

- [ ] Installed plugin capabilities and simple/variant ownership decision are documented with actual repository paths.
- [ ] Existing simple and multi-variant products still resolve to the correct cart merchandise identifier.
- [ ] Public catalog types contain no purchasing/private operational fields.
- [ ] Stable IDs and option identities are independent of EN/ES display labels.
- [ ] Migration sequencing and compatibility strategy cover current products, variants, and saved carts.
- [ ] Tests cover simple product, multi-variant product, missing relationship, and missing translation behavior.
- [ ] Shared execution checks pass or specific blockers are recorded.

### Out of scope

New catalog fields beyond foundation, stock ledger, promotions, currency conversion, and production data changes.
