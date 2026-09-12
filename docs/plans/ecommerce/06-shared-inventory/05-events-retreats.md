# Task 06.5: events and retreats

> JIRA: PMG-364

## Scope

Add later operational workflows for event and retreat stock after the shared
inventory contract and local-sale workflows are stable. Do not create a second
catalog, POS, warehouse system, or offline synchronization layer.

## Functional requirements

- Allocate sellable units to an event or retreat through an authorized CMS workflow.
- Allocated units become unavailable to online purchase without being deducted twice.
- Record sales against an allocation using the same inventory ledger and idempotency rules.
- Release unused allocation and restore online availability atomically.
- Prevent negative stock and conflicting allocation updates.
- Warn operators about disconnected events and stale manual records.
- Preserve actor, channel, reason, timestamps, source version, and idempotency references.
- Keep exact allocations, balances, thresholds, and event notes private.
- Revalidate public availability, carts, and checkout after allocation, sale, or release.
- Defer online reservation races and payment reconciliation to Task 07.

## Definition of Done

- [ ] Authorized staff can create, inspect, update, sell against, and release allocations.
- [ ] Allocation makes affected items unavailable online without double subtraction.
- [ ] Sale against allocation and release preserve inventory invariants.
- [ ] Repeated allocation, sale, and release requests are idempotent.
- [ ] Concurrent updates produce recoverable conflicts rather than lost writes.
- [ ] Stale or disconnected event records are visibly actionable to operators.
- [ ] Public availability and stale-cart recovery reflect allocation changes.
- [ ] Permissions prevent customer access and API bypasses.
- [ ] EN/ES desktop/mobile, keyboard, privacy, failure, and concurrency checks are recorded.
