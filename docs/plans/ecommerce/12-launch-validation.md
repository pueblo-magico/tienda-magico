# 12 — Ecommerce release validation and operator handoff

Status: planned. Depends on: 01–11 or explicitly approved reduced scope.

## Codex implementation prompt

Validate the implemented ecommerce features as one end-to-end system and prepare a release handoff. Follow `docs/plans/ecommerce/README.md`. Do not deploy or run production migrations without separate authorization.

### Feature request

Create safe local/staging fixtures covering a simple item, 100 g/500 g variants, one-of-a-kind item, discontinued item, missing translation, BRL private cost with ARS selling price, inactive taxonomy, video, scheduled discount, pending/approved reviews, and offline stock allocation.

Exercise CMS creation through storefront discovery/detail/cart, sandbox payment, order reconciliation, reservation release, stock counts, and offline adjustments. Inspect actual public response bodies and populated relationships for private field leaks. Test anonymous and wrong-role access, not just admin previews.

Audit currency and money consistency, translation readiness, shareable filters, product links, accessibility, stale caches, promotion expiry, retries, and concurrent last-item purchases. Confirm event allocations protect web stock. Validate any invitation/ranking jobs actually have an operational execution mechanism.

Prepare an ordered migration/backfill plan with backup prerequisites, rollback/forward-fix strategy, and a checklist for catalog/inventory staff. Update contradictory historical documentation, including localization default and checkout lifecycle descriptions. Record measured verification results and remaining launch blockers.

### Definition of done

- [ ] End-to-end evidence covers both locales, mobile/desktop, keyboard, loading/empty/error states, and sandbox payment outcomes.
- [ ] Security matrix proves private purchasing/customer data is absent from public APIs, files, logs, and storefront responses.
- [ ] Concurrency/retry tests prove one-of-a-kind safety and exactly-once business effects.
- [ ] Existing Shopify/provider behavior and persisted cart compatibility have regression coverage.
- [ ] Required builds, lint, formatting, migrations on disposable data, and automated suites run successfully or are listed as blockers.
- [ ] Operator workflows for publication, offers, review moderation, event sales, stock counts, and incident recovery are documented.
- [ ] Deferred features are explicitly unavailable/disabled, with no misleading controls or claims.
- [ ] User receives a go/no-go report; production deployment remains separately authorized.
