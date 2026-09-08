# 04 — Sellable items, variants, ARS prices, and fulfillment data

Status: planned. Depends on: 01, 02.

## Codex implementation prompt

Implement commercial product/variant editing and storefront selection using the ownership model established in task 01. Follow `docs/plans/ecommerce/README.md`.

### Feature request

Each sellable item owns a unique stable SKU, optional barcode, stable option/value relationships, ARS regular price, active/discontinued state, optional variant media, net content quantity/unit, sales unit, packed shipping weight, package dimensions, and one-of-a-kind policy. Shared content remains on the product. Support 100 g and 500 g variants with independent prices and inventory identities.

Store measurement values in documented canonical units and format customer-facing values by locale. Distinguish net content from packed shipping weight and retail unit from supplier purchase unit. Validate nonnegative measurements and positive sellable quantities. Define zero-price behavior explicitly instead of allowing accidental free items.

Use the existing plugin ARS pricing source and validate integer minor units; adapt to existing Money contracts safely. Do not add a parallel prices table or multi-currency checkout. Missing/invalid price must not become zero or a purchasable fallback. Product price range is derived from eligible variants, not manually edited.

Variant selectors show localized labels, variant-specific media with product fallback, correct price, and purchasability. Cart identifiers continue to map to the exact sellable item. Exact internal stock balances should not be newly exposed to public clients; provide availability and a safe purchase limit where needed.

### Required storefront representation

- Product detail (`/[locale]/shop/[handle]`): implement accessible selectors for the actual sellable options, localized option labels, selected ARS price, variant media with product fallback, and public net content/sales unit. A simple product uses the same purchase contract without an unnecessary selector. Keep packed shipping measurements in fulfillment logic unless an existing customer-facing shipping explanation needs them; never label packed weight as net content.
- Selection and purchase controls: changing an option updates price, media, availability, and quantity constraints together. Unpriced, inactive/discontinued, and unavailable combinations show a localized explanation and cannot be added. Enforce the one-of-a-kind limit in UI and server validation. Handle missing options, pending requests, and failed additions without losing the customer's valid selection.
- Cards and listings, including CMS featured-product blocks and existing related-product cards: consume the authoritative eligible-item price or price range in ARS and consistent purchase eligibility. Do not advertise an unavailable variant's price as a purchasable starting price. Define the no-eligible-items state explicitly.
- Cart drawer and cart page: show the exact selected variant/options, quantity, image fallback, ARS unit price and totals. Preserve item identity across reloads and language switches. Surface a changed price or invalid/discontinued selection with actionable localized feedback; never silently substitute another variant.
- Existing checkout handoff: preserve selected item identity, quantities, and ARS pricing through `@/lib/checkout`. Update the existing checkout UI for commercial-validation failures introduced here. Task 07 owns reservation/payment lifecycle work, but the current selection-to-cart-to-checkout flow must work when this task is complete.
- Document cache refresh/revalidation so CMS price, option, media, and lifecycle edits reach every affected storefront surface. Reuse canonical UI controls and update `/ui-system` for changed shared variants/states.

### Human acceptance flow

Create a simple item and a product with 100 g/500 g variants, distinct SKUs, prices, and media. In EN and ES, compare listing prices, select each size, add it to cart, change quantity, reload, switch language, and enter the existing checkout flow. Edit a price and discontinue a variant in CMS, then verify rendered updates and stale-cart recovery under the documented refresh policy. Repeat with an unpriced item, missing variant media, a one-of-a-kind item, and a failed cart request. Record desktop/mobile and keyboard results in a manual checklist alongside this task; distinguish executed checks from pending verification.

### Definition of done

- [ ] Simple and multi-variant editing use one authoritative SKU/price path.
- [ ] Duplicate SKU/option combinations and invalid money/measurement values are rejected.
- [ ] Selected size changes price/media and adds the correct variant to cart in EN and ES.
- [ ] ARS persists through language changes, cart, and payment mapping.
- [ ] Discontinued, unpriced, and unavailable variants cannot be purchased.
- [ ] One-of-a-kind items have max quantity one and cannot enable backorders; stock concurrency enforcement is delivered by task 07.
- [ ] Existing IDs/prices/cart references survive migration or have verified remapping.
- [ ] CMS edits are verified through persistence, the public contract, cards/listings, detail selectors, cart drawer/page, and existing checkout UI using the documented refresh policy.
- [ ] The human acceptance flow passes in EN/ES at desktop/mobile widths with keyboard access and loading/error/unavailable states; evidence is recorded. Backend fields or mapping tests alone do not complete this feature.
- [ ] Shared tests, builds, documentation, and responsive keyboard checks are complete.

### Out of scope

Promotional price fields, live exchange rates, supplier purchasing history, and automatic repackaging.
