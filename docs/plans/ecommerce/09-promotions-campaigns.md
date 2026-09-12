# 09 — Scheduled offers, coupons, and campaign presentation

Status: planned. Depends on: 04, 07, 08.

## Codex implementation prompt

Implement one authoritative promotion evaluation path shared by catalog display, cart, and checkout. Follow `docs/plans/ecommerce/README.md`.

### Feature request

Regular ARS prices remain on sellable items. Promotions own automatic/coupon activation, percent/fixed reduction/fixed promotional price, eligible products/variants/categories/tags, start/end instants, enabled state, optional minimum spend/quantity, priority, and usage limits. No stacking by default; document deterministic selection of the best eligible offer and tie-breaking. Validate bounded amounts and prevent negative totals.

Campaigns own localized title/copy, banner, optional shared slug, featured products, and linked promotions. Campaign visibility does not itself grant a discount. Provide a convenient create-offer action from the product editor without creating competing sale-price fields.

Return resolved regular/effective price, same-currency savings, and eligible offer label through commerce contracts. Coupon-only and customer-specific offers are not universal public sale prices. Preserve price history for legitimate reference prices; do not invent compare-at amounts. Handle differing variant prices and 'from' presentation honestly.

Re-evaluate on the server at cart/checkout, invalidate relevant caches at scheduled boundaries, and record immutable discount allocations on order lines. Define integer rounding, allocation of fixed discounts across lines, minimum-spend basis, shipping/tax treatment, usage reservation/release, and late payment behavior before enabling offers. Do not let simultaneous checkouts exceed usage limits. Adapt Mercado Pago amounts to equal the accepted order total.

### Definition of done

- [ ] Scheduled automatic offers show consistent regular/reduced prices and savings on listing, detail, cart, and checkout.
- [ ] Coupons are normalized, validated server-side, rate-limited as appropriate, and give localized feedback without exposing private targeting rules.
- [ ] Start/end boundaries, overlapping rules, expiry during checkout, invalid codes, limits, and concurrent redemption are tested.
- [ ] Discount allocation/rounding produces exact ARS totals and supports partial refunds without changing historical prices.
- [ ] Price filtering/sorting from task 08 follows a documented effective-price policy, excluding unavailable coupon-only prices.
- [ ] Campaign copy/media supports EN/ES; disabling a campaign does not accidentally alter unrelated promotions.
- [ ] Promotion APIs and caches do not disclose private coupon or customer eligibility data.
- [ ] Sandbox payment totals, migration, operator guide, and shared verification are complete.

### Out of scope

Buy-X-get-Y, bundles, loyalty points, subscriptions, live exchange rates, and complex promotion stacking.
