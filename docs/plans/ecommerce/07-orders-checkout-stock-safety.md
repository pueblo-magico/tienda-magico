# 07 — Reliable orders, payments, and checkout stock protection

Status: planned. Depends on: 04, 06. Launch blocker.

## Codex implementation prompt

Complete the transaction lifecycle linking existing Payload carts/orders, Mercado Pago checkout, and shared inventory. Follow `docs/plans/ecommerce/README.md` and inspect the current checkout implementation rather than trusting historical documentation.

### Feature request

Create authoritative server-side checkout quotes from current catalog and stock. Persist immutable order-line snapshots: product/variant references, SKU, localized title and selected options, quantity, ARS unit/line amounts, and explicit shipping/tax/discount amounts where applicable. Preserve originals on later product edits; cancellation/refund events must not rewrite history.

Implement documented separate order/payment/fulfillment states, with allowed transitions. Use provider-neutral order identifiers; never expose guest cart secrets through gateway external references, URLs, logs, or order identifiers. Keep existing guest-cart authorization intact and audit secret propagation.

Atomically reserve stock at the defined checkout milestone, with expiry/release, payment failure/cancel handling, and success conversion to sold stock exactly once. Resolve reservation duration and late asynchronous payment policy explicitly: an expired reservation followed by payment must enter safe revalidation/refund/manual resolution, never silently oversell. Adding an item to a casual cart must not reserve indefinitely.

Verify webhook authenticity before side effects, retrieve payment authoritatively, validate amount/currency/order association, and process duplicate/out-of-order notifications idempotently. Browser success redirects are not payment proof. Provide reconciliation for interrupted processing. Confirm plugin hooks and application logic do not both decrement inventory or create duplicate orders.

### Definition of done

- [ ] Two customers racing for the final unit produce at most one valid stock allocation; one-of-a-kind quantity is enforced server-side.
- [ ] Changed price, insufficient stock, wrong currency, and stale cart are handled before payment with localized actionable feedback.
- [ ] Successful payment creates/updates one order and one stock effect, including webhook retries and reconciliation.
- [ ] Forged, mismatched, duplicate, delayed, and out-of-order events are tested in sandbox/local fixtures.
- [ ] Expiry, cancellation, failure, and late success preserve inventory and financial state consistency.
- [ ] Order snapshots survive later name/price/variant edits; customer ownership protects all order reads.
- [ ] Guest secrets and payment internals do not leak into logs, responses, or provider metadata.
- [ ] Recovery procedures, migration, tests, and actual sandbox verification are documented; unavailable gateway verification is a launch blocker, not a pass.

### Out of scope

New payment providers, automated accounting, multi-currency settlement, and full warehouse fulfillment tooling.
