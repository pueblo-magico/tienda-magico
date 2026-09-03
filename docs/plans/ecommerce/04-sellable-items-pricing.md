# 04 — Sellable items, variants, ARS prices, and fulfillment data

Status: planned. Depends on: 01, 02.

## Codex implementation prompt

Implement commercial product/variant editing and storefront selection using the ownership model established in task 01. Follow `docs/plans/ecommerce/README.md`.

### Feature request

Each sellable item owns a unique stable SKU, optional barcode, stable option/value relationships, ARS regular price, active/discontinued state, optional variant media, net content quantity/unit, sales unit, packed shipping weight, package dimensions, and one-of-a-kind policy. Shared content remains on the product. Support 100 g and 500 g variants with independent prices and inventory identities.

Store measurement values in documented canonical units and format customer-facing values by locale. Distinguish net content from packed shipping weight and retail unit from supplier purchase unit. Validate nonnegative measurements and positive sellable quantities. Define zero-price behavior explicitly instead of allowing accidental free items.

Use the existing plugin ARS pricing source and validate integer minor units; adapt to existing Money contracts safely. Do not add a parallel prices table or multi-currency checkout. Missing/invalid price must not become zero or a purchasable fallback. Product price range is derived from eligible variants, not manually edited.

Variant selectors show localized labels, variant-specific media with product fallback, correct price, and purchasability. Cart identifiers continue to map to the exact sellable item. Exact internal stock balances should not be newly exposed to public clients; provide availability and a safe purchase limit where needed.

### Definition of done

- [ ] Simple and multi-variant editing use one authoritative SKU/price path.
- [ ] Duplicate SKU/option combinations and invalid money/measurement values are rejected.
- [ ] Selected size changes price/media and adds the correct variant to cart in EN and ES.
- [ ] ARS persists through language changes, cart, and payment mapping.
- [ ] Discontinued, unpriced, and unavailable variants cannot be purchased.
- [ ] One-of-a-kind items have max quantity one and cannot enable backorders; stock concurrency enforcement is delivered by task 07.
- [ ] Existing IDs/prices/cart references survive migration or have verified remapping.
- [ ] Shared tests, builds, documentation, and responsive keyboard checks are complete.

### Out of scope

Promotional price fields, live exchange rates, supplier purchasing history, and automatic repackaging.
