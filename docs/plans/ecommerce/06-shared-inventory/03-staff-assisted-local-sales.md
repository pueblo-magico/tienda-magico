# Task 06.3: staff-assisted local sales

> JIRA: PMG-362

## Scope

Provide a private CMS workflow for staff-operated local sales after the
self-service webshop flow is stable. This is separate from Stage 1 webshop
local-sale records and does not create a second public checkout.

## Functional requirements

- Restrict the collection and all mutations to authorized staff and administrators.
- Support guest buyers with optional contact information.
- Use states: `draft`, `pending_payment`, `paid`, `cancelled`, and `conflict`.
- Reject invalid transitions, repeated confirmation, and edits to confirmed snapshots.
- Capture actor, timestamp, idempotency reference, and audit-safe reason for mutations.
- Support manual `cash` payment recording with amount, currency, time, receiver, and note.
- Support manual `mercado_pago_transfer` recording with reference, amount, currency,
  time, payer note, and explicit account verification by authorized staff.
- Never call automated Mercado Pago authorization for manual transfers.
- Never treat a browser redirect, receipt image, or customer assertion as verification.
- Capture immutable product/variant, SKU, options, quantity, price, currency, and total snapshots.
- Draft and pending sales do not reserve or reduce stock.
- Confirmation revalidates lifecycle, price, currency, and availability, verifies
  payment evidence, and creates exactly one idempotent ledger movement atomically.
- Stock or price conflict leaves the sale actionable; it must not partially confirm.
- Support administrator-controlled refund, return, cancellation-after-paid, and
  reversal movements without rewriting historical snapshots.
- Require a live CMS connection for saving, payment verification, and confirmation.

## Boundary requirements

Task 07 owns automated online payment, order, reservation, webhook, and
reconciliation state. Manual payment evidence stays in this private workflow
and cannot enter the automated webhook path. Task 05 supplier and cost data is
not part of the sale snapshot or payment evidence.

## Definition of Done

- [ ] Unauthorized customers cannot read or mutate staff local-sale records.
- [ ] State transitions and immutable-field protections are server-enforced.
- [ ] Cash and manual Mercado Pago transfer verification have separate audited paths.
- [ ] Payment evidence records verifier, amount, currency, reference, time, and reason where applicable.
- [ ] Confirming a sale creates one movement only after successful revalidation and payment verification.
- [ ] Price, lifecycle, currency, and stock conflicts are recoverable and do not oversell.
- [ ] Repeated requests and retries are idempotent.
- [ ] Refunds, returns, no-shows, cancellations, and reversal permissions are documented and tested.
- [ ] CMS pending, saving, success, failure, and conflict states are usable on desktop/mobile.
- [ ] Staff, manager, finance, and administrator permissions are tested, including API bypass attempts.
