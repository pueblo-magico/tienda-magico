# 02 — Bilingual categories, reusable tags, and brands

Status: implemented; pending manual CMS-to-storefront verification. Depends on: 01.

## Codex implementation prompt

Implement structured classification for products. Follow `docs/plans/ecommerce/README.md` and the catalog ownership contract from task 01.

### Feature request

- Extend Categories with localized name/description/SEO, one stable slug shared between EN/ES, image, optional parent, display order, and visibility. Translation/name edits must not regenerate the slug. Reject self-parenting and cycles.
- Add public Brands with name, shared slug, logo, optional localized description, country code, optional website, and active state. Brand names need not be translated automatically.
- Add public Tags with stable ID/slug, EN/ES label, optional localized description, optional grouping, and visibility. Do not use public tags for private operational labels.
- Products have one primary category, optional additional categories, a brand, and shared tag relationships. Primary category determines breadcrumbs; include it in effective category membership without maintaining a conflicting duplicate list.
- Migrate existing category relationships and localized free-text tags without guessing ambiguous EN/ES equivalences. Produce an unresolved mapping report and require review for ambiguous tags; do not discard them silently.
- Preserve the provider-independent collection API while exposing stable taxonomy identities needed for filters.

### Required storefront representation

- Shop/category browsing: render visible CMS categories with their localized name, optional image/description, and configured ordering. Reuse the existing collection/browsing surface; category links must resolve using the existing slug and locale behavior.
- Category membership: show products assigned through either primary or additional categories without duplicates. Reflect parent hierarchy in category context and product breadcrumbs; the primary category owns the product breadcrumb path.
- Product detail: display the assigned public brand name and optional logo, primary category breadcrumb, and visible localized tag labels. Omit absent/inactive relationships cleanly without empty headings or broken links. Only render links where a supported destination exists; no placeholder brand/tag routes.
- Product cards: use the canonical category label where classification is shown. Keep taxonomy presentation consistent with product detail rather than duplicating label mapping in components.
- Missing images, empty categories, inactive records, and incomplete translations must have intentional storefront states. Public visibility must be enforced by the data boundary as well as the UI.
- Basic category browsing and taxonomy display belong to this task. Combined category/price/tag filtering, search, and related-product ranking remain in task 08; do not defer all visible taxonomy integration to that task.

### Definition of done

- [ ] Editors can create, translate, order, and assign classifications in CMS.
- [ ] Locale switching changes labels, not product classification or filter identity.
- [ ] Duplicate category slugs are rejected server-side across locales within the category collection; category cycles are rejected. Language switching and translated-name edits preserve the same slug.
- [ ] Inactive taxonomy entries follow a documented visibility policy without breaking existing product references.
- [ ] Old category/tag data is migrated or explicitly flagged for manual resolution.
- [ ] Public reads expose only intended taxonomy/brand fields; writes require authorized staff.
- [ ] Tests include bilingual tag identity, hierarchy cycles, inactive references, and existing collection compatibility.
- [ ] Categories are visible and navigable in the storefront with correct ordering, hierarchy, membership, localized content, and preserved URLs.
- [ ] Product detail renders brand, primary-category breadcrumbs, and visible tags from CMS relationships; cards reuse canonical classification labels where applicable.
- [ ] Creating, translating, reassigning, and hiding test classifications in CMS is verified in rendered storefront pages in EN/ES, including refresh/revalidation behavior and empty/missing-image states.
- [ ] Desktop/mobile and keyboard checks cover category navigation and taxonomy presentation. Adapter-only fixtures are supplemented with CMS-to-storefront verification and a manual checklist alongside this task.
- [ ] Migration, generated artifacts, documentation, and shared verification are complete.

### Out of scope

Supplier records, separate campaign collections, advanced search/filter UI, standalone brand/tag landing pages, and automated taxonomy translation. Basic category browsing and product taxonomy presentation are in scope.

## Implementation notes

- `category` remains the primary product category so existing product assignments and URLs remain compatible. `additionalCategories`, `brand`, and `taxonomyTags` are shared relationships.
- Category, brand, and tag slugs are stable identities shared by EN and ES. Localized label edits never change them.
- Anonymous Payload reads are constrained to visible categories/tags and active brands. The storefront mapper repeats that policy defensively and exposes only public fields.
- Existing localized free-text product tags are preserved read-only as a migration-review source. They are used only as a storefront fallback until reusable tags are assigned; no ambiguous EN/ES equivalence is guessed.
- Category lists revalidate after 120 seconds; individual category and product views revalidate after 60 seconds. Refresh after that window, or restart development servers, when verifying CMS edits without an on-demand webhook.
- The category filter renders the complete visible hierarchy as nested radio options. The category-card strip shows root categories without a filter and switches to the selected category's direct visible children when a category is active.
- A database migration is required before starting the updated CMS. Its rollback removes the new taxonomy tables and relationships but intentionally leaves the legacy free-text tag rows untouched.

## Verification

Follow [02-taxonomy-brands-manual-test.md](./02-taxonomy-brands-manual-test.md). Automated catalog coverage verifies shared identities, localized labels, hierarchy mapping, relationship deduplication, inactive records, and unsafe brand links.
