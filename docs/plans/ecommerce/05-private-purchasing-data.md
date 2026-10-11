# 05 — Private supplier, cost, and commercial agreement information

## Scope implemented by TIENDA-25

The CMS adds private suppliers and explicitly separates the public **Brand**
from the operational **Supplier**. Each supplier defines default purchase or
consignment terms. A product can inherit them or store a specific override,
using either basis points or a fixed minor-unit amount, currency, and effective
date range.

Only `purchasing`, `finance`, and `admin` roles can read or edit this data.
Customers, visitors, and other roles do not receive it through REST, GraphQL,
Local API, or public product population. Sales obligations, settlements, and
supplier payouts remain separate work in TIENDA-34 and TIENDA-35; this task
provides their private, versioned contractual source.

In the CMS UI, percentages and money amounts use human-scale, two-decimal
inputs: `35` is presented as `35.00%`, and `1250` as `1,250.00`. Persistence
still uses basis points and minor currency units to avoid floating-point errors.
Supplier country and product origin share the same searchable ISO 3166-1
selector, while cost and agreement currencies use a searchable ISO 4217
selector.

The down migration reassigns `purchasing` and `finance` users to `admin` before
removing those enum values. This avoids invalid accounts but deliberately loses
role granularity and must be reviewed before a production rollback.
The later migration that introduces `editor` applies the same compatibility in
its own rollback.

## Auditable agreement revisions

The private **Supplier agreements** collection complements the supplier's legacy
defaults and product overrides. Each record has a unique reference, supplier,
optional product or variant scope, revision number, previous revision, lifecycle
status, and commercial terms.

The lifecycle is `draft` → `active` → `expired` or `terminated`. Purchasing can
prepare drafts, while only finance or administration can activate or close a
revision. Activation records the approver and timestamp. Approved financial
terms are immutable; contractual changes require a consecutive new revision.
Approved agreements cannot be deleted, and the termination reason becomes
immutable once recorded.

Active revisions require a valid effective start date. Effective periods of
approved revisions may not overlap for the same supplier and scope; activation
uses a PostgreSQL transactional advisory lock to serialize concurrent attempts.
Expiring or terminating a revision closes its effective period without extending
an earlier end date. A variant revision must also identify its product. The
previous revision must be consecutive and retain the same supplier and scope.

Percentage agreements explicitly state how product discounts, allocated order
discounts, taxes, allocated shipping, tips/donations, and actual payment fees
affect the supplier basis. TIENDA-34 will snapshot this definition into immutable
obligations; this increment does not yet create debt or balances when a sale is
confirmed.

Payload versions provide additional audit history. The supplier screen exposes
the reverse relationship and allows authorized staff to create revisions from
that workflow. Records remain restricted to `purchasing`, `finance`, and `admin`.

When a product is published, the server resolves the approved agreement in
effect with variant → product → supplier precedence. Ambiguous or missing
coverage blocks publication. During the transition, existing embedded product
or supplier terms count as an explicit legacy fallback; the CMS coverage
indicator distinguishes them from a versioned revision so they can be migrated
without interrupting the catalog. The `editor` role may maintain the public
product record, while purchasing fields and the agreements collection remain
server-side denied.

**Increment status:** code, generated types and migration, unit tests, and the
PostgreSQL integration test are complete. Integration coverage includes Local
API, REST reads and writes, GraphQL, and populated relationships for anonymous,
customer, and editor access; a type assertion also protects the public contract.
The full migration chain passed from a clean disposable database. Manual CMS
acceptance verified the purchasing → finance → publishing workflow with dummy
data: supplier creation, a formatted BRL 1,250.00 cost with explicit `1 g`
basis and date, a useful invalid-basis message, finance activation, linked
coverage, successful publication, and editor access to public fields without
the private values. Anonymous EN/ES listing and detail pages also rendered the
same public ARS price after the private edit; desktop and 390 px mobile DOM plus
server-rendered HTML contained none of the dummy private markers. A temporary
local inventory unit then exercised Rape Sunu itself through the cart and the
checkout review; only its public ARS price was present, and restoring inventory
to zero produced the expected availability warning without breaking review.
Authenticated-customer and keyboard acceptance remains pending.

Status: in progress. Depends on: 01, 04.

## Codex implementation prompt

Implement a deliberately small, secure purchasing-information feature. Follow `docs/plans/ecommerce/README.md`.

### Feature request

Add private Supplier records with name, country, optional contact information, supplier reference, and internal notes. Supplier is not Brand and supplier country is not product origin.

Attach private operational data to the sellable item: optional supplier, supplier SKU, unit cost amount/currency (including BRL), cost basis quantity/unit, cost last-updated date, and internal notes. Clearly identify whether the cost buys a finished retail unit or a bulk amount; do not silently compute one from the other. Store money without floating-point errors. Do not calculate margins by subtracting BRL from ARS.

Implement least-privilege permissions for purchasing/finance versus catalog/inventory staff, compatible with existing users/admin roles. Keep private data in restricted records and/or protected fields behind an explicit boundary. Provide convenient CMS access for authorized users without exposing it through product population.

Audit direct REST/GraphQL, Local API calls, adapter mappings, public product/search/cart responses, exports, logs, and caches for leakage. Admin field hiding is not security. Use test-only dummy supplier information.

### Required CMS UI and storefront implications

- Authorized purchasing/finance users need a complete CMS workflow to create/select a supplier and view/edit item costs, currency, basis, update date, and notes from the sellable-item workflow. Show validation, save feedback, missing optional data, and denied-access states. Make the distinction between purchase cost and public ARS selling price clear; do not require raw API calls for routine operations.
- Catalog/inventory users without purchasing permission must retain their permitted product and stock workflows without receiving private field values or supplier records in admin client payloads. Enforce this on the server as well as in the UI.
- Public product cards/listings, product detail, CMS product blocks, cart drawer/page, and checkout must continue to render only allowlisted commercial data. Supplier identity, supplier SKU, contacts, costs/currencies, cost basis, dates, and internal notes have no customer-facing representation. Public Brand and origin remain their separate editorial sources.
- A supplier/cost edit must not change public ARS prices, price ranges, currency formatting, product origin/Brand, purchase eligibility, or cart totals. Optional or inaccessible purchasing records must not break catalog rendering or checkout. No public component may need privileged purchasing access.
- Verify rendered HTML, client/RSC payloads, metadata/structured data where present, browser network responses, and public caches as well as adapter types and direct APIs. Redaction in visible text alone is insufficient. Implement any necessary storefront mapping or UI fixes within this task.

### Human acceptance flow

Using dummy data, have an authorized user create a supplier and save a BRL cost with an explicit basis for an ARS sellable item through the CMS UI. Confirm persistence after reload and meaningful validation for invalid cost/basis values. Repeat as a catalog/inventory user and verify private access is denied while permitted editing still works. Browse listing/detail, add the item to cart, and enter existing checkout anonymously and as a customer in EN/ES. Change the private data and repeat: public prices/content must remain unchanged and dummy private values must be absent from rendered output and network payloads. Repeat with no supplier/cost record. Record responsive/keyboard CMS and storefront checks and permission/leakage evidence in a manual checklist alongside this task.

### Definition of done

- [x] Authorized staff can edit BRL costs for products sold in ARS, with explicit cost basis and date.
- [x] Catalog editors and ordinary customers cannot read/write private purchasing fields unless explicitly granted permission.
- [x] Anonymous API calls, populated product relationships, and storefront responses contain no costs, supplier contacts, or notes.
- [x] Public product types cannot accidentally serialize private operational records.
- [x] Permission tests cover anonymous, customer, editor, finance, and admin; denied writes leave data unchanged.
- [x] Cost/currency validation, role migration, generated artifacts, and operator documentation are complete.
- [x] Authorized staff complete the supplier/cost workflow through usable CMS screens, including validation and denied-access behavior; API-only CRUD is insufficient.
- [x] Real storefront listing/detail/cart/checkout flows remain functional with missing or restricted purchasing data, and private edits do not alter public prices, currency, Brand, or origin.
- [ ] EN/ES desktop/mobile and keyboard checks plus rendered/network leakage checks are recorded for the human acceptance flow. Completion covers the full private workflow and its public boundary.

### Out of scope

Purchase orders, landed-cost accounting, automatic currency conversion, profitability dashboards, and private document uploads.
