# 11 — Newness, bestseller overrides, and reliable sales ranking

Status: planned. Depends on: 03, 07.

## Codex implementation prompt

Implement coherent merchandising badges without independent conflicting booleans. Follow `docs/plans/ecommerce/README.md`.

### Feature request

Provide newness and bestseller modes: automatic, force on, force off. Use first-published time, not draft creation or last update, for automatic newness. Keep first publication stable across edits/unpublish/republish; document migration for historical products with unknown publication dates.

Newness window, bestseller ranking window, minimum sales threshold, and rank cutoff are configurable business settings. Propose and document initial values before enabling automatic behavior. Bestseller ranking uses net paid units with explicit handling of cancellations, returns, refunds, ties, variant aggregation, and eligible channels. Offline stock adjustments alone are not verified paid sales; exclude them unless backed by qualifying sale records.

Recompute through a documented job/invalidation path with calculation timestamp and failure behavior. Manual modes win over automatic results. Do not present zero-data products as bestsellers. If reliable reconciled sales are unavailable, keep automatic bestseller off and explain why in CMS. Use the same derived state for badges, featured selections, and best-selling sort.

### Definition of done

- [ ] Editors can intentionally force on/off or return to automatic mode.
- [ ] Newness does not reset on content updates or republishing.
- [ ] Tests cover paid/unpaid/canceled/refunded sales, ties, window boundaries, insufficient data, and manual overrides.
- [ ] Automatic ranking has one authoritative calculation and documented refresh/staleness policy.
- [ ] Badges and sort agree across listing/detail in EN/ES; private sales totals are not exposed publicly.
- [ ] Historical backfill, job operation, editor guidance, and shared checks are complete.

### Out of scope

Forecasting, revenue analytics dashboards, external analytics services, and inferred offline revenue.
