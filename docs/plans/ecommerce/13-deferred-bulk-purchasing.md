# 13 — Deferred: bulk repackaging and purchasing history

Status: deferred. Depends on: 05, 06, 07. Execute only after explicit prioritization.

## Codex implementation prompt

After explicit approval, extend the existing private purchasing/inventory feature to support bulk stock and auditable repackaging. Follow `docs/plans/ecommerce/README.md`.

### Feature request

Add purchase receipts with supplier, original amount/currency, quantities/units, date, and private references. Preserve original costs; any reporting conversion stores rate/source/date without rewriting history. Do not replace existing simple unit-cost entry until its migration and derived/manual ownership are clear.

Represent bulk materials and packaging as non-storefront stock items. Conversion recipes describe inputs and expected finished outputs but do not themselves create stock. A confirmed operation atomically deducts measured inputs, records packaging/wastage, and adds measured finished quantities. Support different outputs from the same bulk input. Use idempotency and reversal entries, not silent history edits.

Assess lots/expiry only with explicit business requirements. Do not infer that an available kilogram of cacao equals ten ready-to-ship bags. Protect operations against concurrent use of the same bulk stock.

### Definition of done

- [ ] Receipts preserve original currency/cost basis and remain private.
- [ ] Repackaging conserves measured material subject to explicit recorded wastage and unit conversion.
- [ ] A 1,000 g input can produce five 100 g bags and one 500 g bag, with packaging tracked when configured.
- [ ] Insufficient bulk/packaging stock fails atomically; duplicate operations do not duplicate outputs.
- [ ] Reversals, concurrent conversions, fractional quantities, and unit mismatches are tested.
- [ ] Finished stock alone drives storefront availability; historic simple cost/stock data remains compatible.
- [ ] Operator documentation, migrations, and shared verification are complete.

### Out of scope

Full accounting, supplier payment processing, manufacturing planning, and regulatory batch tracking unless separately approved.
