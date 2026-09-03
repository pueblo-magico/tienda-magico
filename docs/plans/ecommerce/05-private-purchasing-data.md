# 05 — Private supplier and cost information

Status: planned. Depends on: 01, 04.

## Codex implementation prompt

Implement a deliberately small, secure purchasing-information feature. Follow `docs/plans/ecommerce/README.md`.

### Feature request

Add private Supplier records with name, country, optional contact information, supplier reference, and internal notes. Supplier is not Brand and supplier country is not product origin.

Attach private operational data to the sellable item: optional supplier, supplier SKU, unit cost amount/currency (including BRL), cost basis quantity/unit, cost last-updated date, and internal notes. Clearly identify whether the cost buys a finished retail unit or a bulk amount; do not silently compute one from the other. Store money without floating-point errors. Do not calculate margins by subtracting BRL from ARS.

Implement least-privilege permissions for purchasing/finance versus catalog/inventory staff, compatible with existing users/admin roles. Keep private data in restricted records and/or protected fields behind an explicit boundary. Provide convenient CMS access for authorized users without exposing it through product population.

Audit direct REST/GraphQL, Local API calls, adapter mappings, public product/search/cart responses, exports, logs, and caches for leakage. Admin field hiding is not security. Use test-only dummy supplier information.

### Definition of done

- [ ] Authorized staff can edit BRL costs for products sold in ARS, with explicit cost basis and date.
- [ ] Catalog editors and ordinary customers cannot read/write private purchasing fields unless explicitly granted permission.
- [ ] Anonymous API calls, populated product relationships, and storefront responses contain no costs, supplier contacts, or notes.
- [ ] Public product types cannot accidentally serialize private operational records.
- [ ] Permission tests cover anonymous, customer, editor, finance, and admin; denied writes leave data unchanged.
- [ ] Cost/currency validation, role migration, generated artifacts, and operator documentation are complete.

### Out of scope

Purchase orders, landed-cost accounting, automatic currency conversion, profitability dashboards, and private document uploads.
