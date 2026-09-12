# Task 06.1: webshop local purchase

> JIRA: PMG-360

## Scope

Enable a visitor to use the existing webshop and Mercado Pago checkout while
explicitly choosing local collection or online delivery. Do not create a second
catalog, price source, cart, payment flow, POS, or QR-per-product feature.

## Functional requirements

- Discover products through normal navigation, search, direct URLs, or staff-shared links.
- Select the exact sellable product or variant before adding it to the cart.
- Require a localized, keyboard-accessible choice between:
  - local collection with no delivery address or shipping step;
  - online delivery using the existing fulfillment requirements.
- Persist the choice through cart, quote, checkout, payment return, and order views.
- Do not infer the choice from URL, IP, Wi-Fi, location, or analytics.
- Create one private local-sale record linked to the ecommerce order.
- Store immutable commercial snapshots: product/variant IDs, SKU, localized title,
  selected options, quantity, unit price, currency, and total.
- Keep payment status authoritative; browser redirects are never payment proof.
- Use idempotency for checkout retries, callbacks, refreshes, and reconciliation.
- Follow Task 07 for reservation timing and payment lifecycle.
- At the agreed authoritative payment/inventory boundary, create exactly one
  shared-inventory effect without double-counting reservations.
- Keep exact stock, reservations, thresholds, locations, and operational notes private.

## Boundary requirements

The local-sale record must not contain Task 05 supplier, supplier SKU, cost,
cost currency, cost basis, purchasing dates, or internal purchasing notes. Task
07 owns online order, payment, reservation, and late-payment state transitions;
this milestone owns the local-collection mode and local operational linkage.

Pending, rejected, cancelled, late, or unverified payments must remain
recoverable and must not be shown as collected purchases.

## Acceptance checks

- Both local-collection and delivery paths complete through the existing checkout.
- Local collection does not request delivery data; delivery still does.
- Locale changes and reloads preserve mode and item identity.
- Affected stale-cart lines are actionable while unaffected lines remain.
- Duplicate callbacks cannot create duplicate local records or stock effects.
- Inventory or checkout failures fail closed with localized recovery actions.

## Definition of Done

- [ ] The buyer can select and change local collection or delivery before finalization.
- [ ] The selected mode is persisted in cart, quote, order, and local-sale data.
- [ ] One idempotent local-sale record is linked to each local-collection order.
- [ ] Payment state comes from the authoritative payment integration.
- [ ] Reservation conversion and stock-effect ownership are documented with Task 07.
- [ ] Retries, duplicate callbacks, late payment, and insufficient stock have tested outcomes.
- [ ] No QR-per-product or local-Wi-Fi mechanism is required.
- [ ] Public responses contain no private inventory or Task 05 purchasing data.
- [ ] EN/ES desktop, mobile, keyboard, stale-cart, and failure-state checks are recorded.
