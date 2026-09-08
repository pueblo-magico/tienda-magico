# 06 — Simple shared inventory and offline sale adjustments

Status: planned. Depends on: 04, 05.

## Codex implementation prompt

Implement one shared inventory pool for online, retreat, and event sales, with lightweight auditable adjustments. Follow `docs/plans/ecommerce/README.md`.

### Feature request

Provide on-hand quantity, reserved quantity, available quantity, private reorder threshold, and stock-count metadata per sellable item. Define available as on hand minus active reservations/allocations and optional safety stock; no independently editable availability field. Reuse or transactionally project the plugin inventory field through one documented owner, preventing hooks from double-decrementing stock.

Add stock adjustments with item, signed quantity, reason (receipt, offline sale, return, damage, correction), channel (web, retreat, event), actor, timestamp, and idempotency reference. Add a staff action to record an offline sale promptly. It records stock movement, not a complete accounting/payment transaction.

Physical counting captures counted amount, actor/date, and the calculated adjustment, protected against concurrent writes. Provide manual event allocation/release: allocated units are unavailable online until sold or released, without subtracting the same units twice. Warn operators about disconnected events and stale manual records.

Use atomic updates, authorization, and validation. Prevent negative stock unless an explicitly approved policy permits it. Private exact balances and reorder thresholds never flow into the public catalog. Provide a minimal private record of manual conversion adjustments for future bulk support; do not implement a packaging engine in this task.

### Required CMS UI and storefront representation

- CMS item inventory workflow: authorized staff can inspect private on-hand/reserved/allocated/available quantities, record receipts/offline sales/returns/damage/corrections, reconcile a physical count, and allocate/release event stock. Show adjustment history, actor/channel/reason, validation, pending/save/failure states, and concurrency conflicts with a safe refresh/retry path. Make clear that an offline stock adjustment is not a payment/accounting record.
- Product cards/listings, CMS featured products, and existing related-product cards: reflect public availability from the same shared pool. Product detail and variant selectors show localized available/unavailable states and disable purchase for exhausted variants. Never infer retail availability from supplier or bulk stock.
- Quantity controls on product detail, cart drawer, and cart page consume a documented safe purchase limit without exposing exact balances, reservation/allocation totals, or reorder thresholds. Define that limit as a public purchase-policy cap rather than an exact-stock readout; omit it if it cannot meet the privacy contract and handle server rejection accessibly. Server validation remains authoritative.
- Existing carts: after an offline sale or allocation reduces availability, revalidate on cart load, quantity changes, and the existing checkout entry. Show which line needs attention with localized quantity-adjustment/removal actions, retain unaffected lines, and prevent proceeding with known-invalid quantities. Do not silently remove items or imply that cart contents reserve stock.
- Existing checkout UI must surface inventory rejection with an actionable return to the affected cart line. Task 07 still owns atomic checkout reservations, expiry, and payment reconciliation; this task must deliver the current storefront stock feedback and server checks without claiming final-unit checkout concurrency is solved.
- Define and implement cache invalidation/revalidation for each inventory mutation so open or revisited storefront surfaces reconcile under a documented freshness policy. On inventory-service failure, show a recoverable state and prevent unverified purchases rather than assuming stock is available. Reuse shared controls and update `/ui-system` when shared availability/error states change.

### Human acceptance flow

Start with a known local stock fixture and open product detail and a cart containing that item. Record a retreat sale through CMS; verify listing/detail availability and stale-cart feedback after the documented refresh/revalidation trigger. Allocate the remaining stock to an event and verify online purchase becomes unavailable; record a sale against the allocation, then release unused units and verify online availability returns correctly. Exercise receipt, return, damage, and count correction through the UI. Repeat an adjustment request, submit competing updates, and simulate a failed stock read/write to verify no double deduction, lost updates, misleading success, or unverified purchase. Run EN/ES desktop/mobile and keyboard checks, and inspect public payloads for private quantities. Record results in a manual checklist alongside this task.

### Definition of done

- [ ] A retreat/event sale reduces availability from the same pool used by web commerce.
- [ ] Repeated adjustment requests do not double-deduct; simultaneous adjustments cannot lose updates.
- [ ] Count reconciliation, damage, return, receipt, and low-stock threshold behavior are tested.
- [ ] Event allocation, sale against allocation, and unused allocation release preserve stock invariants.
- [ ] Staff cannot overwrite calculated quantities or bypass permissions using APIs.
- [ ] Migration from current plugin inventory preserves existing stock and documents reconciliation.
- [ ] Operators have a practical adjustment/count workflow and clear limitations.
- [ ] CMS adjustment/allocation/count screens are usable end to end, including save failures and concurrent-edit recovery.
- [ ] A CMS inventory mutation reaches cards/listings, detail/variant controls, cart drawer/page, and existing checkout feedback through the documented freshness policy.
- [ ] Exhausted stock, stale carts, one-of-a-kind limits, and unavailable inventory services produce actionable localized UI without exposing exact balances or claiming a reservation.
- [ ] The human acceptance flow has recorded EN/ES desktop/mobile, keyboard, privacy, and failure-case results; inventory APIs alone do not complete the feature.
- [ ] Shared verification passes; checkout reservation integration remains task 07, not claimed complete here.

### Out of scope

Separate warehouses, POS integration, purchasing ledger, automatic bulk conversion, and offline synchronization.
