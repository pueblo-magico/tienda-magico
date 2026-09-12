# Plan: Task 06, mixed commerce and shared inventory

Status: planned. Depends on: 04, 05. Checkout reservations, payment webhooks,
payment reconciliation, and final-unit checkout races remain owned by Task 07.

## Goal and priority

Connect the physical self-managed store to the existing ecommerce catalog and
checkout without creating a second catalog, price source, cart, or payment flow.
The first release should let a visitor discover and buy independently through
the webshop, explicitly choose local collection or delivery, and give the store
an operational local-sale record. The same sellable-item identity, price,
availability, and payment contracts must continue through both paths.

The priority order is:

1. Webshop self-service purchase with an explicit local-purchase choice and a
   local sale record.
2. Camera-assisted product discovery on the webshop.
3. Staff-assisted technical support for the same ecommerce purchase flow.
4. Shared inventory and operational stock controls.
5. Events, retreats, allocations, and releases.

The online checkout remains the authoritative purchase path. Local collection is
not a second checkout, POS, or payment bypass. It is a fulfillment mode attached
to the existing product, cart, quote, payment, and order contracts.

## Stage 1: self-managed local purchase through the webshop

### Visitor flow

The visitor opens the webshop through normal navigation, search, a direct
product URL, or a link shared by staff. There is no QR-code-per-product
requirement and no QR feature in this stage. The visitor reviews the product and
current availability, selects the exact product or variant, and adds it to the
existing cart.

Before the order is finalized, the buyer must make an explicit, localized,
keyboard-accessible choice between:

- **Local purchase / collection:** the buyer is at the physical store, collects
  the purchase there, and does not need delivery, shipping, or a delivery
  address.
- **Online purchase / delivery:** the normal ecommerce fulfillment requirements
  continue.

The choice must not be inferred from a URL, IP address, Wi-Fi network, device
location, or analytics signal. It must persist through cart, checkout, payment
return, and order views, and the buyer may change it before finalization subject
to the selected mode's validation rules.

Both modes use the same catalog, prices, variant identity, availability, cart,
checkout quote, payment, and order contracts. Local collection changes
fulfillment and operational handling, not price, currency, payment authority,
or stock validation.

### Local sale record

Selecting local collection creates or updates a private local-sale record linked
to the authoritative ecommerce order. It must use an idempotency key so quote
retries, checkout retries, refreshes, duplicate callbacks, and reconciliation
jobs cannot create duplicate records or movements.

The first-stage local-sale record includes:

- local channel and selected store/location, if multiple locations are supported;
- ecommerce order reference and permitted buyer/contact data;
- creation, update, payment, collection, and audit timestamps;
- immutable product/variant IDs, SKU, localized title, selected options,
  quantities, unit prices, currency, and order-total snapshots;
- fulfillment mode, with no shipping address required for local collection;
- authoritative payment status and operational status;
- collection readiness, collected/cancelled state, and audit metadata without
  storing payment credentials, guest-cart secrets, or gateway secrets.

The browser's payment-success redirect is never payment proof. The local record
follows the authoritative payment state from the existing checkout integration.
Pending, rejected, cancelled, late, or unverified payments remain actionable
states and must not be presented as collected purchases.

### Inventory effect and record boundary

At authoritative payment confirmation, the local webshop order must produce
exactly one idempotent stock effect using the shared inventory pool. Pending
orders do not reduce stock. The effect must be atomic, reject insufficient
availability, and preserve a recoverable conflict if another channel consumed
the stock first. Task 07 owns online reservation timing and payment races; this
plan owns the local-collection boundary and its handoff to the shared inventory
service.

The relationship between the commercial local-sale record and the inventory
ledger movement remains an explicit implementation decision:

- **Separate linked records:** the local sale is the commercial/order record and
  the ledger movement is the stock record, linked by an immutable movement ID.
- **Unified record:** one record owns both commercial local-sale data and the
  stock movement while retaining the audit fields required by the ledger.

Before schema implementation, choose one model and document how retries,
refunds, cancellations, returns, and manual reconciliation behave. Regardless
of model, the system must prevent duplicate deductions and must not treat a
stock adjustment as proof of payment.

### Local-flow behavior

- Show a clear localized indication of the selected local or delivery mode,
  including that local collection has no delivery step.
- Preserve the mode without placing secrets or payment data in URLs.
- Never let changing the mode change the product identity, silently replace a
  selected variant, or bypass checkout validation.
- Revalidate price, lifecycle, availability, and quantity at quote/checkout
  boundaries; keep unaffected cart lines when one line becomes invalid.
- On inventory or checkout failure, show a recoverable state and prevent an
  unverified purchase rather than assuming availability.
- Do not expose exact stock, reserved/allocated quantities, reorder thresholds,
  internal locations, or staff-only notes.

### Stage 1 acceptance

- A visitor can find a product through the webshop and complete the existing
  cart-to-Mercado-Pago flow without staff intervention.
- The buyer explicitly chooses local collection or delivery before finalization,
  and the choice appears in cart and order state.
- Local collection requires no delivery address or shipping step; delivery keeps
  the normal fulfillment requirements.
- A local purchase creates exactly one idempotent local-sale record linked to
  the ecommerce order.
- Authoritative payment confirmation causes exactly one idempotent shared-stock
  effect; pending or unverified payment causes none.
- A stock conflict leaves the record actionable and never silently oversells.
- Payment, price, availability, discontinued, stale-cart, and inventory-service
  failures use localized, accessible recovery states.
- The selected mode survives locale changes, cart reloads, checkout handoff,
  payment return, and safe order lookup without changing item identity or price.

## Stage 2: camera-assisted product discovery

After Stage 1 is reliable, add an opt-in camera entry point in the webshop. The
visitor can photograph a physical product or its packaging and receive one or
more candidate product matches. The visitor must confirm a candidate before the
product page opens and must still choose local collection or delivery explicitly.
Recognition never selects a fulfillment mode, variant, price, or purchase.

The first version treats image recognition as discovery assistance, not an
authoritative product or purchase decision:

1. Request camera permission only after the visitor chooses the scan action.
2. Capture the image locally where possible and explain if an upload is required.
3. Send it through a server-side recognition boundary or approved provider;
   provider credentials never enter the browser.
4. Return ranked candidates with confidence and visible product/variant labels.
5. Require explicit candidate confirmation before navigation.
6. Open the confirmed product page through normal webshop navigation.
7. Fall back to text search or staff assistance for low confidence, denied
   permission, unavailable cameras, offline use, timeouts, or recognition error.

Do not use face recognition, infer customer identity, retain images by default,
or claim that a visual match proves a particular SKU. Recognition must not alter
price, availability, variant selection, fulfillment mode, or checkout
validation. Define retention and deletion rules before storing images or
recognition results.

### Stage 2 acceptance

- Supported mobile browsers handle permission denied, unavailable camera,
  offline, timeout, upload failure, and low-confidence states.
- An uncertain result never adds an item to the cart automatically.
- A confirmed result opens the same product page without choosing local
  collection or delivery for the buyer.
- Text-search and staff fallbacks are useful and accessible.
- Images, recognition requests, and results do not leak personal data or
  provider credentials and are not retained without an approved policy.

## Stage 3: staff-assisted technical support

After self-service discovery is usable, staff may accompany the visitor without
operating a separate checkout. Staff can:

- open or share the correct product URL or webshop search result;
- search the catalog and select the correct variant;
- explain availability, price, net content, local collection versus delivery,
  and checkout steps;
- recover stale carts, unavailable items, failed payment redirects, or camera
  problems; and
- return the visitor to their own device and payment session where possible.

Staff must not edit client-controlled prices, bypass checkout validation, expose
private balances, or mark payment complete from a browser success page. Support
records should use an opaque session/context reference and never copy payment
credentials or guest-cart secrets.

A later staff-operated assisted-sale workflow may support guest contact data,
`cash` or manually verified `mercado_pago_transfer`. This is a separate
private CMS workflow from the Stage 1 webshop local-sale record: staff creates
the sale, selects the sellable item and quantity, records the buyer's optional
contact details, chooses the payment method, and submits it for payment or
confirmation.

### Staff-operated local-sale flow

The CMS collection is private and available only to authorized staff and
administrators. Customers cannot create, update, confirm, cancel, or inspect
these records through public APIs. Staff may create a sale for a guest buyer;
an account is not required. Every mutation records the actor, timestamp,
request/idempotency reference, and an audit-safe reason.

The record has explicit states and allowed transitions:

- `draft`: staff is still entering items, buyer details, and payment method;
- `pending_payment`: the sale is complete enough to await payment evidence;
- `paid`: staff has verified payment and the inventory movement succeeded;
- `cancelled`: the sale will not be completed and has no pending confirmation;
- `conflict`: payment evidence may exist, but price or availability changed
  before confirmation and staff must resolve the sale explicitly.

The implementation must reject invalid transitions, repeated confirmation, and
edits to immutable fields after payment or stock confirmation. A cancelled or
conflicted sale cannot be silently reused as a new sale; staff must create a
new attempt or use the documented administrator-only correction flow.

### Payment ownership and verification

This flow owns manual payment recording; it does not call Mercado Pago to
authorize or automatically confirm a transfer. Supported methods are:

- `cash`: staff records that cash was received and by whom, with the received
  amount, currency, time, and optional note;
- `mercado_pago_transfer`: staff records the transfer reference, amount,
  currency, time, and payer note, then explicitly confirms that the reference
  and amount were checked in the Mercado Pago account.

The payment evidence is private. A transfer reference, receipt image, or staff
assertion alone does not transition the sale to `paid`; the authorized staff
action must validate the expected currency and amount and record the verifier.
The system must never expose gateway credentials, allow the customer to mark a
transfer as verified, or imply that a browser redirect verified a manual
transfer. If the amount, currency, reference, or payment status is uncertain,
the sale remains `pending_payment` or moves to `conflict`.

### Snapshots, confirmation, and stock

At creation and before confirmation, the CMS reads the authoritative product
or variant and records an immutable snapshot containing product/variant IDs,
SKU, localized title, selected options, quantity, unit price, currency, and
total. Staff cannot edit the snapshot price or identity to force confirmation.

Draft and `pending_payment` sales do not reserve or reduce stock. Confirming a
sale performs one atomic operation that:

1. revalidates the current sellable item, lifecycle, price, currency, and
   available quantity against the snapshot;
2. verifies the manually recorded payment evidence and authorized verifier;
3. creates exactly one idempotent inventory-ledger movement; and
4. changes the sale to `paid` only if the movement succeeds.

If price, currency, lifecycle, or availability changed, the sale moves to
`conflict` and remains pending for an explicit staff decision. It must not
deduct stock, partially confirm, or silently replace the item or quantity.
Repeated confirmation with the same idempotency key returns the existing
result and cannot create a second movement. A failed transaction leaves the
sale and payment evidence recoverable without claiming success.

### Reversals and operational safeguards

Cancellation before payment or stock confirmation is available to authorized
staff. Returns, refunds, cancellation after `paid`, and reversal of a stock
movement require the documented administrator permission, a reason, and a
compensating idempotent ledger movement; they never rewrite the original
snapshot or delete its audit history. The initial implementation must define
whether a no-show is cancelled, returned, or held for manual resolution.

The CMS must show pending, saving, success, failure, and conflict states, with
a safe refresh/retry action. It must distinguish a local sale/payment record
from an inventory adjustment and must not expose exact stock balances to
customers. This flow does not implement offline synchronization: saving,
payment verification, confirmation, and stock mutation require a live CMS
connection.

## Stage 4: shared inventory and operational records

Stage 4 implements one shared inventory pool for online purchases, Stage 1 local
orders, later assisted sales, retreat sales, and event operations.

### Inventory contract

For every sellable item, provide:

- on-hand quantity;
- active reserved quantity;
- active event/allocation quantity;
- available quantity, calculated as on-hand minus active reservations,
  allocations, and any documented safety stock;
- private reorder threshold and stock-count metadata; and
- a single documented owner for the plugin inventory projection.

There must be no independently editable availability field and no duplicate
hook that decrements the same stock effect twice. Exact balances, thresholds,
allocations, and operational notes remain private. The public catalog exposes
only localized availability and, when compatible with privacy, a safe purchase
limit that is a policy cap rather than an exact-stock readout.

### Ledger and mutations

Add an auditable ledger with sellable item, signed quantity, reason, channel,
actor, timestamp, and idempotency reference. Reasons include receipt, webshop
sale, local webshop sale, assisted/offline sale, return, damage, correction,
and physical-count reconciliation. Channels include web, local store, retreat,
and event.

All mutations use authorization, validation, atomic updates, negative-stock
protection, and idempotency. Repeated requests cannot double-deduct, and
competing updates cannot lose writes. Restrict direct editing of the plugin
`inventory` field after migration to the shared inventory owner.

Physical counting captures counted quantity, actor, date, calculated adjustment,
and the source balance/version used for the calculation. Concurrent changes must
produce a conflict with a safe refresh/retry path rather than overwrite newer
movements. Manual conversion adjustments may be recorded for future bulk
support, but no packaging engine is implemented here.

### CMS workflow

Authorized staff can inspect private balances and history, record receipts,
local/offline sales, returns, damage, corrections, and count reconciliations,
and later allocate or release event stock. The CMS must show actor, channel,
reason, timestamps, validation, pending/save/failure states, and concurrency
conflicts. It must clearly distinguish an inventory adjustment from a payment or
accounting transaction.

Customer, staff, manager, and administrator permissions must be explicit. Staff
cannot overwrite calculated quantities or bypass authorization through APIs.
Destructive, financial, refund, return, and already-confirmed-sale reversal
actions require documented permissions and audit entries.

### Storefront and cart behavior

Product cards, listings, featured products, related-product cards, detail pages,
and variant selectors use public availability from the shared pool. Exhausted
items are unavailable and cannot be purchased. Retail availability must never
be inferred from supplier or bulk stock.

After a local sale, assisted sale, allocation, or other inventory mutation:

- revalidate carts on cart load, quantity changes, and checkout entry;
- identify affected lines and offer localized quantity adjustment, removal, or
  product-return actions;
- retain unaffected lines and never silently remove or replace variants;
- surface inventory rejection in checkout with an actionable return to the cart;
- invalidate or revalidate affected catalog surfaces under a documented freshness
  policy; and
- fail closed with a recoverable state when the inventory service cannot verify
  availability.

Task 07 still owns atomic online checkout reservations, expiry, webhook
verification, payment reconciliation, and final-unit races. Task 06 must provide
current public stock feedback and server checks without claiming that casual
carts reserve stock.

## Stage 5: events and retreats

Events and retreats are later operational slices. Add manual allocation, sale
against allocation, and release of unused units only after the shared inventory
contract and local support flow are proven. Allocated units become unavailable
online until sold or released, without subtracting the same units twice.

Warn operators about disconnected events and stale manual records. Allocation,
sale-against-allocation, and release operations must be atomic and idempotent.
This stage does not create a second catalog, add POS integration, or implement
offline synchronization.

## Offline-friendly boundary

The physical store may cache or preload public catalog pages for read-only
browsing and show a last-updated timestamp with an explicit stale-data warning.
Camera recognition, cart changes, payment, local-sale creation, inventory
mutation, and staff confirmation require a live connection. Local drafts may be
stored only as unconfirmed drafts and must never be presented as purchases,
reservations, or stock movements.

## Main implementation surfaces

- `src/app/[locale]`, product routes, cart, and checkout: preserve the existing
  ecommerce contract and carry the selected fulfillment mode.
- `src/features/product` and shared UI: local-versus-delivery choice, camera
  entry point, candidate confirmation, permission/error states, and accessible
  fallbacks.
- `src/lib/commerce`, `src/lib/checkout`, and route handlers: keep provider
  boundaries intact; carry fulfillment mode without using it for price
  authorization.
- CMS collection and hook overrides: local-sale records, inventory ledger,
  permissions, and later assisted-sale workflows remain private and authorized.
- Migrations: inventory backfill, ledger, idempotency, rollback, and
  reconciliation without changing existing sellable-item IDs or cart references.
- `messages/en.json` and `messages/es.json`: all customer-visible modes, states,
  errors, and recovery actions localized through `next-intl`.
- Tests: fulfillment-mode validation, local-sale idempotency, payment-state
  handling, exactly-once stock effects, camera permission and failure states,
  candidate confirmation, stale carts, privacy, authorization, inventory
  concurrency, physical counts, event allocation, and migration safety.

## Decisions and open policy

- Stage 1 and Stage 2 use the existing ecommerce page and payment checkout.
- Stage 1 does not create QR codes for products or require QR scanning.
- Stage 1 requires an explicit local-collection or delivery choice and a private
  order-linked local-sale record.
- A paid Stage 1 local order affects shared inventory only after authoritative
  payment confirmation, exactly once.
- Camera recognition is an opt-in discovery aid with explicit confirmation and
  text/staff fallbacks.
- Staff initially provides technical assistance rather than operating a second
  checkout.
- No local flow grants discounts, bypasses payment, or exposes exact inventory.
- No offline confirmation, payment verification, or inventory synchronization
  is implemented.
- Cancellations, returns, refunds, no-shows, and reversal permissions must be
  defined before production rollout.
- Choose and document the separate-record versus unified-record model before
  implementing the local-sale and inventory schemas.

## Verification order

1. Test normal webshop discovery in EN/ES and complete both local-collection and
   delivery checkout paths on mobile and desktop.
2. Verify the mode choice, no-shipping behavior, order state, and exactly-once
   local-sale creation across retries, reloads, and payment callbacks.
3. Verify that pending/unverified payment creates no stock effect and that
   authoritative payment confirmation creates one effect only.
4. Test camera permission, low confidence, candidate confirmation, upload
   failure, timeout, no-network, and text-search fallback.
5. Test staff assistance without exposing secrets or private stock.
6. Exercise receipt, local/offline sale, return, damage, correction, physical
   count, stale-cart recovery, failed inventory reads, and concurrent updates.
7. Exercise event allocation, sale against allocation, and release only after
   Stage 4 is implemented.
8. Run EN/ES desktop/mobile keyboard and accessibility checks, lint, builds, and
   migrations on a disposable database.

## Explicitly out of scope for the current stages

- Generating or printing a QR code for every product, shelf, or label.
- A QR scanning flow as the Stage 1 entry point.
- Local-Wi-Fi-only access restrictions.
- A second POS or staff-operated checkout in Stage 1.
- Separate warehouses, purchasing ledger, automatic bulk conversion, packaging
  engines, and offline synchronization.
