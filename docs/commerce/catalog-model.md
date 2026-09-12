# Catalog ownership — PMG-218

## Authoritative records

The inspected installation uses `@payloadcms/plugin-ecommerce` 3.87.1. Its
`dist/collections/products/createProductsCollection.js`,
`dist/collections/variants/createVariantsCollection/index.js`, and
`dist/fields/variantsFields.js` support simple products directly and variants
linked to their parent product. Our overrides remain in
`apps/cms/src/collections/Products.ts`.

| Data                                        | Owner                                |
| ------------------------------------------- | ------------------------------------ |
| Shared editorial content and classification | Product                              |
| Simple item price and inventory             | Existing product row                 |
| Variant item price and inventory            | Existing variant row                 |
| Option identity                             | Variant type and option database IDs |
| Display labels                              | Localized content, never an identity |
| Public projection                           | Commerce adapter allowlist           |

A simple item has a presentation-only `ProductVariant` in the storefront contract;
it does not create a hidden Payload variant. Enabled variant products with missing
joined variants are unavailable, not converted into simple products. Parent prices
and inventory must not override variant commercial data. SKU and shipping-field
editing belong to task 04; this task adds no competing write path.

## Stable shared slugs

Products and categories each have one stable slug shared between EN/ES. Slugs are
not localized. Name/translation edits must not regenerate them; switching language
changes the locale, not the slug or record identity. Slugs are unique within their
respective collections across both locales. Existing URLs and stored values remain
unchanged. Intentional slug changes require approval and a redirect/compatibility
plan, not an automatic migration. Adapter tolerance of locale-keyed legacy values
does not change this CMS contract. Stable database IDs remain independent of slugs.

## Merchandise references and saved carts

Public Payload merchandise references are opaque `product:<id>` or `variant:<id>`
strings. Database IDs remain unchanged. The adapter resolves these into the
plugin's original product and optional variant relations before cart mutation.
This prevents equal numeric IDs in separate collections from selecting the wrong
item. Shopify IDs remain unchanged.

Legacy `productId:variantId` pairs and unambiguous bare IDs remain supported.
Ambiguous bare IDs fail with a refresh-required conflict rather than guessing.
Saved carts retain their cart reference, secret, line IDs, and stored relations;
reads emit the new qualified merchandise reference. No persisted cart rewrite is
needed. Missing parents, mismatched pairs, and disabled variants fail before writes;
network failures are not treated as missing records.

Before adding to a saved cart, the storefront checks that the guest reference
still resolves. An absent/inaccessible saved cart is replaced with a new cart;
transport and pricing errors are propagated without replacement. This is an
explicit preflight, not a catch-all retry of a potentially successful mutation.
Verified locally with an invalid saved reference: add returned HTTP 200 with the
correct variant. Fresh simple-product and variant adds also returned HTTP 200.

Existing carts can also retain references to removed catalogue records. Before
adding an item, the adapter checks stored references and removes unavailable
references in one authenticated update, retaining valid line IDs and quantities.
Transport failures abort cleanup. This prevents Payload's all-line repricing from
failing on an old deleted product. A live reproduction with a removed product
reference subsequently added variant 2, quantity 2, with HTTP 200 and ARS 70,000
line total. This cleanup does not restore deleted products.

Option type IDs and value IDs are exposed alongside existing label-based fields
for compatibility. Unpopulated values keep their IDs; unresolved type identity is
explicit rather than synthesized from translated labels. The storefront selector
uses option/value IDs when available and retains label-only provider compatibility.
An ambiguous or invalid combination resolves to no variant and cannot be purchased;
it never silently selects a default. Choices unavailable in every variant are
disabled, while other choices remain navigable to avoid trapping users between
disjoint combinations. The shared Button supplies focus and disabled behavior.

## Money, privacy, and derived output

Cart mutations return ID-only relationships. The adapter now fetches the populated
cart before mapping and validating line prices, preventing a false 409 after a
successful write. Regression coverage includes add, update, and removal responses.
Live local verification on an isolated guest cart returned HTTP 200 for adding a
variant, changing its quantity to two, and removing it. All 19 catalog tests pass.

ARS is the launch selling currency regardless of locale. Existing Payload
`priceInARS` minor-unit values map to the provider-independent `Money` decimal
string contract. Existing configuration and persistence paths remain authoritative;
strict decimal-safe validation and editing are task 04, not a second pricing engine.

Public output is explicitly mapped, never a spread of CMS records. Supplier data,
purchase costs, internal notes, and administrative variant titles are excluded.
Exact inventory is not returned by this adapter (`quantityAvailable` is null);
availability remains derived from the authoritative item. This projection is not
CMS access control: direct API permissions and private collections require the
server-side protections in tasks 05 and 06.

Price ranges, availability, option groups, and titles are derived during mapping;
there is no new persisted cache or reconciliation job. Existing provider fetch
cache behavior remains unchanged. No claims are made here about complete checkout
stock safety, promotion calculations, or rich-text security auditing.

## Migration and verification

No persisted schema changes occur in PMG-218, so no migration or generated CMS
artifact update is required. Future schema tasks must backfill and validate before
switching readers, preserve IDs, and document rollback. Changing a simple product
into variants requires an explicit saved-cart compatibility policy before release;
do not silently manufacture or remap merchandise.

Run `npm run test:catalog` for isolated regression tests using the existing
TypeScript compiler and Node test runner. Fixtures cover simple/variant ownership,
ID collisions, legacy and saved carts, missing relations, localization fallback,
private-field exclusion, actual cart request mapping, configuration failures, and
Shopify compatibility. These tests mock HTTP boundaries and do not mutate a live
CMS or establish production API authorization coverage.

Review follow-up fixes also remove administrative-title fallback from partially
populated cart lines. Missing variant pricing produces an explicit conflict rather
than a parent-price substitution. Cart mutation failures no longer create a
replacement cart, and refresh failures preserve saved cart identity for retry.

PMG-218 verification: 19 catalog tests pass. Storefront and CMS builds passed
during implementation; type checks and targeted lint passed after the final cart
fix. Full CMS lint retains two unrelated frontend-link errors and 13 warnings;
storefront lint previously reported seven unrelated warnings.

Live local HTTP verification covers add, quantity update, removal, stale cart
recovery, and image optimization. The user subsequently confirmed successful
manual testing on mobile, EN/ES, and cart reload. See the task's manual checklist
for the scope of confirmed results and remaining unreported scenarios.
Automated browser verification was unavailable (`agent-browser` not installed).
Payment completion and production CMS role permissions have not been verified.
