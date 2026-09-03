# 02 — Bilingual categories, reusable tags, and brands

Status: planned. Depends on: 01.

## Codex implementation prompt

Implement structured classification for products. Follow `docs/plans/ecommerce/README.md` and the catalog ownership contract from task 01.

### Feature request

- Extend Categories with localized name/description/SEO, shared slug, image, optional parent, display order, and visibility. Reject self-parenting and cycles.
- Add public Brands with name, shared slug, logo, optional localized description, country code, optional website, and active state. Brand names need not be translated automatically.
- Add public Tags with stable ID/slug, EN/ES label, optional localized description, optional grouping, and visibility. Do not use public tags for private operational labels.
- Products have one primary category, optional additional categories, a brand, and shared tag relationships. Primary category determines breadcrumbs; include it in effective category membership without maintaining a conflicting duplicate list.
- Migrate existing category relationships and localized free-text tags without guessing ambiguous EN/ES equivalences. Produce an unresolved mapping report and require review for ambiguous tags; do not discard them silently.
- Preserve the provider-independent collection API while exposing stable taxonomy identities needed for filters.

### Definition of done

- [ ] Editors can create, translate, order, and assign classifications in CMS.
- [ ] Locale switching changes labels, not product classification or filter identity.
- [ ] Duplicate slugs and category cycles are rejected server-side.
- [ ] Inactive taxonomy entries follow a documented visibility policy without breaking existing product references.
- [ ] Old category/tag data is migrated or explicitly flagged for manual resolution.
- [ ] Public reads expose only intended taxonomy/brand fields; writes require authorized staff.
- [ ] Tests include bilingual tag identity, hierarchy cycles, inactive references, and existing collection compatibility.
- [ ] Migration, generated artifacts, documentation, and shared verification are complete.

### Out of scope

Supplier records, separate campaign collections, search UI implementation, and automated taxonomy translation.
