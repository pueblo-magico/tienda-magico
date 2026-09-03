# 06 — Simple shared inventory and offline sale adjustments

Status: planned. Depends on: 04, 05.

## Codex implementation prompt

Implement one shared inventory pool for online, retreat, and event sales, with lightweight auditable adjustments. Follow `docs/plans/ecommerce/README.md`.

### Feature request

Provide on-hand quantity, reserved quantity, available quantity, private reorder threshold, and stock-count metadata per sellable item. Define available as on hand minus active reservations/allocations and optional safety stock; no independently editable availability field. Reuse or transactionally project the plugin inventory field through one documented owner, preventing hooks from double-decrementing stock.

Add stock adjustments with item, signed quantity, reason (receipt, offline sale, return, damage, correction), channel (web, retreat, event), actor, timestamp, and idempotency reference. Add a staff action to record an offline sale promptly. It records stock movement, not a complete accounting/payment transaction.

Physical counting captures counted amount, actor/date, and the calculated adjustment, protected against concurrent writes. Provide manual event allocation/release: allocated units are unavailable online until sold or released, without subtracting the same units twice. Warn operators about disconnected events and stale manual records.

Use atomic updates, authorization, and validation. Prevent negative stock unless an explicitly approved policy permits it. Private exact balances and reorder thresholds never flow into the public catalog. Provide a minimal private record of manual conversion adjustments for future bulk support; do not implement a packaging engine in this task.

### Definition of done

- [ ] A retreat/event sale reduces availability from the same pool used by web commerce.
- [ ] Repeated adjustment requests do not double-deduct; simultaneous adjustments cannot lose updates.
- [ ] Count reconciliation, damage, return, receipt, and low-stock threshold behavior are tested.
- [ ] Event allocation, sale against allocation, and unused allocation release preserve stock invariants.
- [ ] Staff cannot overwrite calculated quantities or bypass permissions using APIs.
- [ ] Migration from current plugin inventory preserves existing stock and documents reconciliation.
- [ ] Operators have a practical adjustment/count workflow and clear limitations.
- [ ] Shared verification passes; checkout reservation integration remains task 07, not claimed complete here.

### Out of scope

Separate warehouses, POS integration, purchasing ledger, automatic bulk conversion, and offline synchronization.
