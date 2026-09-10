# Ecommerce implementation tasks

Status: planned; no task is implemented by the existence of these documents.

These are feature-based Codex prompts for the agreed Pueblo Mágico CMS and storefront scope. Open one task file and ask Codex to execute its prompt. Each task requires the shared contract below as well as its own definition of done. Do not execute the entire roadmap from one prompt.

## Agreed product decisions

- Spanish is the default content language; English and Spanish are supported.
- Products and categories each have one stable slug shared between EN/ES. Slugs are not localized or regenerated when names/translations change. Language switching changes the locale, not the slug or entity identity. Preserve existing URLs and enforce slug uniqueness within each collection across both locales. Any intentional slug change requires explicit approval and a redirect/compatibility plan.
- Launch selling and checkout currency is ARS only. Content language never selects currency.
- Purchase costs may use other currencies, including BRL. Costs, supplier contacts, purchasing details, exact stock balances, and internal notes are private.
- Inventory is one shared pool across web, retreat, and event sales. Locations are sales context, not separate warehouses initially.
- Purchasing history and advanced inventory management are lower priority. Lightweight stock adjustments and checkout concurrency protection are not optional for launch.
- Bulk repackaging may be needed. Do not infer finished goods from bulk availability. Automated conversion and purchasing ledgers are deferred.
- Regular prices belong to the sellable item. Promotions are separate rules; do not introduce competing sale-price fields.
- The CMS should remain approachable: related records may be edited through product tabs instead of requiring disconnected admin workflows.

## Task sequence and dependencies

| Task                                     | ES                                          | Feature                                               | Depends on | Priority                    |
| ---------------------------------------- | ------------------------------------------- | ----------------------------------------------------- | ---------- | --------------------------- |
| [01](01-catalog-contracts.md)            | —                                           | Catalog ownership and migration foundation            | —          | Foundation                  |
| [02](02-taxonomy-brands.md)              | —                                           | Bilingual categories, tags, brands                    | 01         | Launch                      |
| [03](03-product-content-media.md)        | —                                           | Product storytelling, media, accordions               | 01, 02     | Launch                      |
| [04](04-sellable-items-pricing.md)       | [ES](04-sellable-items-pricing-es.md)       | SKU, variants, ARS pricing, fulfillment data          | 01, 02     | Launch                      |
| [05](05-private-purchasing-data.md)      | [ES](05-private-purchasing-data-es.md)      | Private supplier and cost management                  | 01, 04     | Launch, basic scope         |
| [06](06-shared-inventory.md)             | [ES](06-shared-inventory-es.md)             | Shared stock and manual channel adjustments           | 04, 05     | Launch                      |
| [07](07-orders-checkout-stock-safety.md) | [ES](07-orders-checkout-stock-safety-es.md) | Order snapshots, payment reconciliation, reservations | 04, 06     | Launch blocker              |
| [08](08-discovery-related-products.md)   | [ES](08-discovery-related-products-es.md)   | Search, filters, similar/complementary products       | 02, 03, 04 | Launch                      |
| [09](09-promotions-campaigns.md)         | [ES](09-promotions-campaigns-es.md)         | Offers, coupons, campaign presentation                | 04, 07, 08 | Merchandising               |
| [10](10-product-reviews.md)              | [ES](10-product-reviews-es.md)              | Moderated reviews and verified guests                 | 03, 07     | Merchandising               |
| [11](11-merchandising-badges.md)         | [ES](11-merchandising-badges-es.md)         | Newness, bestseller overrides and ranking             | 03, 07     | Merchandising               |
| [12](12-launch-validation.md)            | [ES](12-launch-validation-es.md)            | Cross-feature release validation and operator handoff | 01–11      | Release gate                |
| [13](13-deferred-bulk-purchasing.md)     | [ES](13-deferred-bulk-purchasing-es.md)     | Bulk conversion and purchasing history                | 05, 06, 07 | Deferred; approval required |
| [14](14-deferred-stock-locations.md)     | [ES](14-deferred-stock-locations-es.md)     | Physical locations and stock transfers                | 06, 07     | Deferred; approval required |

A task may start only when its dependencies are implemented and verified, not merely documented. Tasks 09–11 may be postponed only through an explicit launch-scope decision; task 12 must then document disabled/unavailable features. Automatic ranking in task 11 may remain disabled until trustworthy paid-sales data exists. Tasks 13–14 are not launch commitments.

## Mandatory shared execution contract

Every task prompt below incorporates these requirements:

1. Read root/nearest `AGENTS.md`, `apps/cms/README.md`, `docs/commerce/payload-ecommerce.md`, `docs/commerce/payload-content.md`, and the relevant subsystem documentation. Read the installed Next.js guides before Next.js changes. Inspect installed Payload/plugin APIs rather than assuming current online examples match the installed version.
2. Inspect current code, tests, and Git status. Preserve unrelated work. Do not create a commit, deploy, install an integration, or migrate a production database unless separately authorized.
3. Extend the existing Payload ecommerce plugin; do not build parallel product, cart, order, or pricing systems. Storefront consumers use `@/lib/commerce`, CMS content uses `@/lib/cms`, and payment flows use `@/lib/checkout`. Keep CMS and storefront dependencies separate.
4. Keep a single authoritative write path for commercial data. Derived fields and caches must have an owner, invalidation policy, and reconciliation path. Preserve provider-independent contracts and Shopify behavior when adding Payload support.
5. Localize editorial content and visible UI in EN/ES, including validation/errors and accessibility labels. Keep IDs, SKU, money, relationships, and units shared. Resolve localized labels from stable IDs. Currency is ARS regardless of language.
6. Enforce authorization on the server and API, not through admin visibility. Explicitly allowlist public output, including populated relationships, search results, cart/order responses, rich text, media, logs, and caches. Test anonymous, customer, staff, and administrator access as applicable. Review Payload Local API access bypass behavior.
7. Store money as validated integer minor units in persistence, with explicit currency. Use decimal-safe boundary conversions to the existing `Money` contract. Never trust client-supplied prices, discounts, stock, or ownership.
8. Reuse shared components and tokens. Jost 300 for standard sans text, Jost 700 for sans titles/buttons, Georgia 400 for serif titles. Update `/ui-system` when changing a shared component or state.
9. Persisted schema changes require explicit migrations, safe backfills, compatibility/rollback notes, and representative fixtures. Do not hand-edit generated Payload types/import maps; use generation scripts. Never run destructive migrations against real data without approval.
10. Add behavior-focused regression tests. Run relevant CMS/storefront lint, build/type checks, and touched-file formatting checks. Exercise UI changes on desktop/mobile, EN/ES, keyboard, loading/empty/error states. Use local test data and sandbox payments only. Disclose unavailable checks rather than claiming success.
11. Update editor/developer documentation and this task's status with actual verification evidence. Record unresolved choices or blockers. Do not silently expand scope to a deferred feature.

## Shared completion standard

A feature covers the whole program: CMS/operator UI, persistence, API permissions, domain/provider integration, storefront UI and interactions, migrations, regression coverage, and operator documentation must work together before it is done. Implement affected UI in the same task; do not defer it to an unspecified frontend follow-up. For private operational features, completion includes the authorized CMS UI and verification that storefront flows work without receiving private data. A new collection, API, mapping, or attractive UI alone is not completion.

For customer-facing CMS data, every task must name the storefront surfaces that
consume it and implement those consumers in the same feature. Verify a CMS edit
through persistence, the public contract, and the rendered storefront, including
the documented cache refresh/revalidation behavior. Mapping tests alone are not
end-to-end completion. Private fields must remain absent from public output rather
than receive a storefront representation. Record human test instructions alongside
each task and distinguish implemented code from unexecuted verification.

Tasks 01–07 explicitly specify their storefront representation or private-data
implications, including UI acceptance flows for tasks 04–07. Task 01 now has
implemented storefront consumers, 19 passing tests, live local cart/image checks,
and user-confirmed mobile, EN/ES, and cart-reload acceptance. Its task document
records remaining unreported checks; do not equate them with failed tests or mark
them passed without evidence. The dependency completion rule above still applies.

## Decisions to resolve during implementation

- Task 01: how the installed plugin represents a simple sellable item without duplicating variant data.
- Task 06/07: inventory reservation expiry and payment timing policy; overdue asynchronous payments must not oversell.
- Task 09: tax/shipping treatment and exact rounding/allocation policy before discounts are enabled.
- Task 10: verified-review invitation delivery mechanism; do not assume an email service exists.
- Task 11: configurable newness/ranking windows and minimum sales threshold; proposals require documented defaults.

These decisions must be explicit in the implementation handoff. Material business-policy choices not supported by existing behavior should be brought to the user.
