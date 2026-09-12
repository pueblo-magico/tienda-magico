# Task 06.4: shared inventory operations

> JIRA: PMG-363

## Scope

Implement one authoritative inventory pool for online purchases, Stage 1 local
orders, staff-assisted sales, retreat sales, and event operations.

## Inventory contract

For every sellable item, provide private on-hand, active reserved, active
allocated, reorder-threshold, and stock-count metadata. Calculate available as
on-hand minus active reservations, allocations, and documented safety stock.
Expose only localized public availability and, if privacy permits, a policy
purchase cap rather than exact stock. The plugin `inventory` projection has one
documented owner and no independently editable availability field.

## Ledger and mutations

Record sellable item, signed quantity, reason, channel, actor, timestamp, and
idempotency reference for receipts, webshop sales, local webshop sales,
assisted/offline sales, returns, damage, corrections, and physical-count
reconciliation. Use atomic updates, authorization, validation, negative-stock
protection, and idempotency. Competing requests cannot lose updates or deduct
twice.

Physical counts record counted quantity, actor, date, source balance/version,
and calculated adjustment. Concurrent changes produce a recoverable conflict.
Manual conversion adjustments may be recorded for future bulk support; no
packaging engine is included.

## CMS and storefront behavior

Authorized operators can inspect private balances/history and record receipts,
sales, returns, damage, corrections, and counts. The UI shows actor, channel,
reason, timestamps, validation, save/failure states, and concurrency conflicts.
Role permissions prevent API bypasses and distinguish inventory adjustments from
payment/accounting records.

Cards, listings, featured products, related cards, detail pages, and selectors
use public availability. After inventory mutation, revalidate cart load,
quantity changes, checkout entry, and affected catalog surfaces. Preserve
unaffected lines, provide localized adjustment/removal actions, and fail closed
when availability cannot be verified.

Task 07 owns online checkout reservations, expiry, payment webhooks,
reconciliation, and final-unit races. This milestone supplies the shared
inventory contract and public stock feedback without making casual carts
reservations.

## Migration and privacy

Migrate current product and variant balances without changing sellable IDs or
cart references. Document reconciliation, conflicting balances, rollback, and
idempotency. Exclude Task 05 supplier, supplier SKU, cost, cost currency, cost
basis, dates, and internal notes from public, customer, order, inventory,
export, log, and cache surfaces.

## Definition of Done

- [ ] One authoritative inventory owner and projection are documented and enforced.
- [ ] Available quantity, reservation/allocation accounting, safety stock, thresholds, and purchase caps are tested.
- [ ] Ledger mutations are atomic, idempotent, authorized, and reject negative stock.
- [ ] Receipts, sales, returns, damage, corrections, and physical counts work end to end.
- [ ] Concurrent count and mutation conflicts have safe refresh/retry behavior.
- [ ] Direct inventory overwrites and API permission bypasses are rejected.
- [ ] Listings, detail, selectors, carts, and checkout reflect inventory changes under a documented freshness policy.
- [ ] Stale carts retain unaffected lines and provide actionable localized recovery.
- [ ] Inventory service failures fail closed without claiming availability.
- [ ] Migration preserves IDs/cart references and has rollback/reconciliation evidence.
- [ ] Public and customer payloads exclude exact balances, thresholds, operational notes, and Task 05 purchasing data.
- [ ] EN/ES responsive, keyboard, privacy, failure, and concurrency checks are recorded.
