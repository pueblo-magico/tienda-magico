# Manual test — Task 01 / PMG-218

Status: not executed. This checklist is for a later human review of
[task 01](01-catalog-contracts.md).

Use the local storefront and CMS with test data only. Do not complete real
payments. Record unavailable scenarios as **Not tested**, not Pass.

## Test session

- Tester:
- Date:
- Branch / commit:
- Browser:
- Storefront and CMS URLs:
- Overall result: Not tested

## 1. Prepare test products

In the CMS, create or identify:

- A simple product with variants disabled, an ARS price, and available stock.
- A product with two variants, distinct prices, and available stock—for example,
  100g and 500g.
- A product or variant with zero stock.
- A product with Spanish content but missing some English translations.

Record each product's prices and existing English/Spanish URLs before testing.
Use only editing controls already available; do not add schema fields for this test.

## 2. Simple product

1. Open the simple product in the storefront.
2. Check its name, image, ARS price, and availability.
3. Add two units to the cart.
4. Open the cart and change the quantity.
5. Reload the page.

**Expected:** The correct product remains in the cart, with the correct unit price
and quantity total. No artificial variant appears in the CMS.

## 3. Variant product

1. Open the product with two variants.
2. Select the first variant and add it to the cart.
3. Return, select the second variant, and add it.
4. Inspect both cart lines.
5. Change their quantities independently and reload.

Also test a product with two option types and disjoint combinations (for example,
Small/Red and Large/Blue). Selecting Small/Blue must disable purchase rather than
add Small/Red. Both valid combinations must remain reachable. Where distinct IDs
share a display label, confirm each remains a separate selectable choice and adds
the intended variant. Verify keyboard focus and pressed state on option buttons.

**Expected:** Both variants remain distinct. Each uses its own price—not the parent
product's price—and shows the correct selected option.

## 4. Existing cart compatibility

Ideally, use a browser that already contained a cart before this implementation.

1. Open the existing cart.
2. Verify its products, variants, quantities, and prices.
3. Update a quantity, remove an item, and add another product.
4. Reload.

**Expected:** Existing cart contents continue working without selecting a different
product or variant.

If no pre-change cart is available, mark this test **Not tested**.

## 5. Language and slugs

1. Open an existing product URL in Spanish.
2. Switch to English and back.
3. Repeat from a category page.
4. Open the URLs recorded before testing directly.
5. Check the product with incomplete English translations.

**Expected:** Existing slug and language-switching behavior is preserved. Links
still resolve to the intended content. Missing translations use the configured
fallback without displaying `[object Object]` or changing product identity.
This test does not prescribe a new slug structure.

## 6. Availability

1. Open the zero-stock product or select its zero-stock variant.
2. Attempt to add it through the normal interface.
3. For a variant-enabled test product with no available variants, inspect the page.

**Expected:** Unavailable merchandise is not presented as an available simple
product. Prices never display `NaN` or `Infinity`.

Record any successful purchase-path access to unavailable stock for investigation;
full checkout stock protection belongs to a later task. Do not complete payment.

## 7. Private information

Using test-only values, put a recognizable marker such as `INTERNAL-TEST-ONLY` in
an administrative variant title or an existing private field. Do not put the marker
in a public description or option label.

1. Inspect the product page and cart.
2. In browser developer tools, search storefront network responses for the marker.
3. Check whether exact stock counts are exposed in storefront commerce responses.

**Expected:** No internal marker or exact inventory count appears in the mapped
storefront data. Public option labels identify variants.

This does **not** establish that direct CMS API permissions are secure; those
require separate access-control testing. If the relevant response cannot be
inspected, record that limitation rather than claiming full coverage.

## Results

For each section, record **Pass / Fail / Not tested**, the product URL, language,
steps, and a screenshot for any failure. Do not include cookies, cart secrets,
credentials, or customer information.

| Scenario                    | Result     | Evidence / notes |
| --------------------------- | ---------- | ---------------- |
| Preparation                 | Not tested |                  |
| Simple product              | Not tested |                  |
| Variant product             | Not tested |                  |
| Existing cart compatibility | Not tested |                  |
| Language and slugs          | Not tested |                  |
| Availability                | Not tested |                  |
| Private information         | Not tested |                  |

### Findings and follow-up

- Finding / reproduction steps:
- Expected versus actual behavior:
- Related issue:
- Retest result:

After testing, restore any temporary changes to shared test fixtures and record
remaining limitations here. Do not remove pre-existing data or other testers' carts.
