# Task 06 / Task 07 Boundary Review

Status: review required. This document records boundary issues between
`06-mixed-commerce.md` and `07-orders-checkout-stock-safety.md`. It is
non-normative until the decisions below are accepted and reflected in the
implementation plans.

## Scope boundary

Task 06 owns mixed-commerce operations and the shared inventory boundary:

- local collection as a fulfillment mode for webshop orders;
- the private Stage 1 local-sale record;
- later staff-operated local sales;
- inventory ledger movements and operational stock controls;
- public availability and stale-cart feedback after inventory changes;
- event and retreat allocations in the later Task 06 stage.

Task 07 owns the online transaction lifecycle:

- authoritative checkout quotes;
- online stock reservations, expiry, and release;
- payment provider interaction and webhook verification;
- order, payment, and fulfillment state machines;
- payment reconciliation and late-payment handling;
- final-unit races and checkout-time concurrency.

Both tasks must use the same sellable-item identity, price, currency, order
snapshot, and shared inventory owner. Neither task may create a competing
catalog, price source, inventory balance, payment authority, or checkout flow.

## Boundary issues

### 1. Reservation timing for local collection

Task 06 currently states that a paid Stage 1 local order creates exactly one
stock effect and that pending orders do not reduce stock. Task 07 requires stock
to be reserved at a defined checkout milestone before payment and converted to
sold stock after payment.

The plans must decide whether a local-collection checkout:

- uses the same reservation lifecycle as delivery checkout;
- reserves stock before payment and converts that reservation after payment;
- avoids reservation and accepts the risk of a paid order becoming unavailable;
- or uses another explicitly documented policy.

The chosen policy must define reservation visibility, duration, expiry, release,
competing buyers, payment failure, and insufficient stock behavior. A local
reservation must not be counted again as a separate paid stock deduction.

### 2. Ownership of stock effects

Task 06 requires one idempotent inventory effect after authoritative payment
confirmation. Task 07 requires reservation conversion and exactly-once stock
handling across browser returns, webhooks, retries, duplicate events, and
reconciliation.

Define one authoritative operation owner. Recommended boundary:

- Task 07 owns the checkout reservation and payment-to-order transition.
- The shared inventory service owns the atomic reservation conversion or sale
  movement.
- Task 06 owns local-collection operational handling and later CMS sales.
- A stable order/payment/reservation idempotency key prevents duplicate effects.

No Payload hook, payment webhook, checkout route, or CMS action may independently
deduct the same sale.

### 3. Order, payment, fulfillment, and local-sale states

Task 06 introduces local-sale states such as `draft`, `pending_payment`,
`paid`, `cancelled`, and `conflict`, plus collection readiness. Task 07 requires
separate order, payment, and fulfillment states with valid transitions.

Define a mapping rather than maintaining independent uncontrolled state machines.
At minimum, distinguish:

- authoritative payment state from Mercado Pago;
- ecommerce order state;
- online reservation state;
- fulfillment mode: local collection or delivery;
- local collection readiness and collection completion;
- inventory movement state;
- conflict, reconciliation, cancellation, refund, and return state.

A local-sale `paid` state must never override an order payment state that remains
pending, rejected, cancelled, late, or unverified.

### 4. Snapshot ownership and duplication

Task 06 describes an immutable local-sale snapshot containing product/variant
IDs, SKU, localized title, options, quantity, price, currency, and totals. Task
07 requires the same information in immutable order-line snapshots.

Before implementation, choose whether the local-sale record:

- references the Task 07 order snapshot as its single commercial source;
- stores a deliberate copy with an order-snapshot version or content hash; or
- stores only local operational fields and reads the commercial snapshot from
  the order.

The local record must use provider-neutral order identifiers and must never
store guest-cart secrets, payment credentials, gateway secrets, or secrets in
provider metadata, URLs, or logs.

### 5. Late payment after reservation expiry

Task 07 requires a safe outcome when payment arrives after an online reservation
expires. Task 06 only describes a recoverable stock conflict.

Define the local-collection outcome for late payment. Possible outcomes include
revalidation followed by a new reservation, manual staff resolution, refund or
payment reversal, or an explicitly pending order. The system must not silently
oversell, mark the order collected, or create a second stock movement.

### 6. Cancellation, refund, return, and no-show behavior

Task 06 requires compensating inventory movements for reversals and leaves the
no-show policy open. Task 07 requires payment, order, reservation, and inventory
consistency after cancellation, refund, failure, and late success.

Define transitions and ownership for:

- cancellation before payment;
- payment failure or cancellation;
- cancellation after payment but before collection;
- reservation expiry;
- refund before collection;
- return after collection;
- local-collection no-show;
- reversal of an already posted inventory movement.

Historical order and sale snapshots must remain immutable. Reversals must be
new audited events or compensating movements, never edits to the original
snapshot.

### 7. Manual payments versus online payment integration

Task 06 later supports staff-operated sales paid by cash or manually verified
`mercado_pago_transfer`. Task 07 owns automated online Mercado Pago checkout,
authoritative payment retrieval, and webhook processing.

Manual payment evidence must use a separate payment-evidence path. It must not:

- enter the online webhook verification path;
- be treated as an automated gateway callback;
- use a gateway external order ID as proof of payment;
- expose transfer references or payment evidence publicly;
- allow a customer to mark a transfer as verified.

Authorized staff must record verifier, amount, currency, reference, timestamp,
and reason. The manual flow must have its own idempotency and audit rules.

### 8. Local collection and checkout quote invalidation

Task 07 requires a Task 06 sale or allocation to invalidate an online quote
before payment, and an active online reservation to reduce availability for
local operations.

Define the invalidation contract:

- which quote version or inventory version is checked;
- how local staff sees an active online reservation;
- how a local sale conflicts with a pending online checkout;
- how affected cart lines are reported;
- how unaffected lines are preserved;
- how a customer retries after the conflict;
- how cache revalidation reaches listing, detail, cart, and checkout surfaces.

Neither task should silently replace the selected variant or remove an affected
line without an actionable explanation.

### 9. Shared inventory service and public availability

Task 06 defines the shared inventory pool, ledger, atomic mutations, public
availability, and operational controls. Task 07 consumes that availability for
quotes and reservations.

Define the shared service contract for:

- available quantity and policy purchase limits;
- reservation creation, extension, conversion, and release;
- sale movements and compensating movements;
- optimistic version or locking behavior;
- idempotency keys and duplicate responses;
- negative-stock rejection;
- service failure and fail-closed behavior;
- cache invalidation and freshness guarantees.

Task 07 must not maintain a second reservation or stock calculation that can
fall out of sync with Task 06.

### 10. Permissions and CMS ownership

Task 06 introduces staff-operated sales, inventory adjustments, payment
verification, refunds, returns, and reversal permissions. Task 07 introduces
order inspection, payment reconciliation, reservation inspection, and manual
resolution.

Define a shared role matrix covering at least customer, catalog/inventory staff,
payment/finance staff, manager, and administrator. Specify who may:

- create or edit a draft local sale;
- record or verify cash and manual transfers;
- inspect payment evidence;
- confirm a sale and create a movement;
- inspect or release reservations;
- resolve stock/payment conflicts;
- cancel, refund, return, or reverse a confirmed sale;
- reconcile an interrupted payment;
- access buyer contact data.

Server-side authorization must match the CMS UI and public API behavior.

### 11. Private purchasing data boundary

Task 05 owns supplier, supplier SKU, purchasing cost, currency, cost basis,
update dates, and internal notes. Task 06 local-sale snapshots and inventory
ledger records must not copy or expose those fields.

Verify that Task 06 and Task 07 order, payment, reservation, inventory, exports,
logs, caches, REST/GraphQL, Local API, and RSC responses exclude Task 05 private
purchasing data. Public and customer order views must contain only allowlisted
commercial snapshots and fulfillment/payment information.

### 12. Failure and recovery ownership

Task 06 must expose operational inventory and local-sale conflicts. Task 07
must expose checkout, payment, reservation, and reconciliation states.

Define which task owns each customer-facing state for:

- price change;
- insufficient quantity;
- reservation expiry;
- payment pending;
- payment rejected or cancelled;
- late payment;
- webhook delay or mismatch;
- inventory service failure;
- local-collection conflict;
- refund or return pending.

All states require localized, accessible, actionable UI. A browser return must
never assert successful payment before authoritative verification.

## Required acceptance tests across the boundary

- Two buyers race for the last unit, with local and delivery fulfillment modes;
  no more than one valid reservation or sale succeeds.
- A local-collection checkout with pending payment does not create a sale
  movement; authoritative payment confirmation creates exactly one effect.
- A duplicate webhook, browser refresh, retry, and reconciliation job do not
  duplicate the order, local-sale record, reservation conversion, or movement.
- A local sale or event allocation invalidates an affected online quote while
  preserving unaffected cart lines.
- An active online reservation prevents a staff sale from overselling the same
  item and exposes a recoverable conflict.
- A reservation expires, then payment arrives late; the result follows the
  documented safe policy without silent overselling.
- Price, variant, currency, or availability changes produce a conflict without
  rewriting immutable snapshots.
- Cancellation, refund, return, no-show, and reversal create correct audited
  compensating events and do not mutate historical snapshots.
- Manual cash and transfer verification cannot enter the automated webhook path
  or be performed by a customer.
- Supplier and cost data from Task 05 remains absent from public, customer,
  order, payment, reservation, inventory, export, log, and cache surfaces.
- Role permissions prevent unauthorized sale confirmation, payment verification,
  reservation release, inventory mutation, refund, and reversal.

## Decisions required before implementation

1. Does local collection use the same Task 07 reservation lifecycle as delivery?
2. Which service owns reservation conversion and the final stock movement?
3. How are local-sale, order, payment, fulfillment, reservation, and inventory
   states mapped?
4. Is the local-sale snapshot a reference, a versioned copy, or a separate
   operational snapshot?
5. What is the exact late-payment-after-expiry policy?
6. What are the no-show, cancellation, refund, return, and reversal transitions?
7. Which role may verify manual payments and resolve conflicts?
8. Which role may access buyer contact data and payment evidence?
9. How are Task 05 supplier and cost fields excluded from Task 06/07 records?
