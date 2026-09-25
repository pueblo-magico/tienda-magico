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

The down migration reassigns `purchasing` and `finance` users to `admin` before
removing those enum values. This avoids invalid accounts but deliberately loses
role granularity and must be reviewed before a production rollback.

Status: planned. Depends on: 01, 04.

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

- [ ] Authorized staff can edit BRL costs for products sold in ARS, with explicit cost basis and date.
- [ ] Catalog editors and ordinary customers cannot read/write private purchasing fields unless explicitly granted permission.
- [ ] Anonymous API calls, populated product relationships, and storefront responses contain no costs, supplier contacts, or notes.
- [ ] Public product types cannot accidentally serialize private operational records.
- [ ] Permission tests cover anonymous, customer, editor, finance, and admin; denied writes leave data unchanged.
- [ ] Cost/currency validation, role migration, generated artifacts, and operator documentation are complete.
- [ ] Authorized staff complete the supplier/cost workflow through usable CMS screens, including validation and denied-access behavior; API-only CRUD is insufficient.
- [ ] Real storefront listing/detail/cart/checkout flows remain functional with missing or restricted purchasing data, and private edits do not alter public prices, currency, Brand, or origin.
- [ ] EN/ES desktop/mobile and keyboard checks plus rendered/network leakage checks are recorded for the human acceptance flow. Completion covers the full private workflow and its public boundary.

### Out of scope

Purchase orders, landed-cost accounting, automatic currency conversion, profitability dashboards, and private document uploads.
