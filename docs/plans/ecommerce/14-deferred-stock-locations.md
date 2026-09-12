# 14 — Deferred: physical stock locations and transfers

Status: deferred. Depends on: 06, 07. Execute only after explicit prioritization.

## Codex implementation prompt

After explicit approval, evolve the shared inventory model to support independently tracked physical locations without duplicating stock. Follow `docs/plans/ecommerce/README.md`.

### Feature request

Add locations and per-item balances, distinguishing location from sales channel. An event is not automatically a warehouse. Migrate the existing shared pool into one initial location, preserving all balances, reservations, and history.

Add authorized stock transfers with dispatch/receipt/cancel states and explicit in-transit ownership. Define online-eligible locations and allocation order before enabling multi-location availability. Resolve existing manual event allocations during migration so they are not counted as both reserved and physically transferred stock.

Maintain atomic/idempotent mutations and audit records. Aggregated availability is derived, not separately edited. Do not imply disconnected POS/event devices synchronize automatically.

### Definition of done

- [ ] Existing shared stock migrates without creating or losing units.
- [ ] Dispatch, receipt, cancellation, duplicate requests, and partial receipt policies preserve quantities.
- [ ] Only eligible available stock contributes to online checkout; reservations identify their source.
- [ ] Concurrent sales/transfers cannot oversell or allocate the same units twice.
- [ ] Event allocations and location transfers cannot double-reserve the same inventory.
- [ ] Permission checks, private balance protection, operator docs, migration recovery, and shared verification are complete.

### Out of scope

POS integration, offline conflict synchronization, routing optimization, and multi-currency selling.
