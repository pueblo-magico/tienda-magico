# 03 — Product content, media, and editable information sections

Status: planned. Depends on: 01, 02.

## Codex implementation prompt

Implement rich bilingual product information and its product-detail presentation. Follow `docs/plans/ecommerce/README.md`.

### Feature request

Organize CMS product editing into clear content/classification/media/merchandising tabs, preserving plugin fields. Provide EN/ES name, short description, comprehensive safe rich text, SEO title/description, country code, localized region/community and public origin story. Keep created/updated dates system-managed and first-published date distinct from creation.

Separate editorial draft/publish state from active/discontinued lifecycle. Define discontinued-page behavior: no purchase, but a published page can remain available with alternatives. Show translation readiness without relying on fallback to pretend translation is complete; require critical name/short purchase copy in both locales before initial publication. Handle legacy products through an explicit migration/grace policy.

Extend public product media to ordered images and supported videos, primary image selection, localized alt/caption, and video poster. Enforce upload MIME/size rules, safe delivery, keyboard-accessible controls, and no autoplay with sound. Do not accept arbitrary embed HTML. Public Media must not become storage for private invoices or supplier documents.

Implement shared-structure accordion entries with stable key, localized editable title/body, order, and visibility. Provide editable initial templates for ingredients, how-to-use, origin/impact, and care; support custom entries. Templates populate new content without overwriting existing edits. Hide empty sections. Use the existing safe rich-text renderer and extend supported nodes deliberately.

### Required storefront representation

- Product detail: show localized name and short description near the purchase controls, comprehensive content in the main description area, and public origin/region/community information in an appropriate information section. Avoid repeating the same story in multiple blocks; never show purchasing/internal fields.
- Media gallery: render the CMS-defined order and primary image, allow image/video selection, and use localized alt text/captions and video posters. Include keyboard controls, responsive layouts, loading/failure placeholders, and a deliberate no-media fallback. No autoplay with sound.
- Information accordions: render visible, non-empty CMS sections in their configured order using stable keys and the shared accordion component. Edited titles, custom sections, and localized bodies must appear without hard-coded section lists. Define emptiness after the documented locale fallback is applied.
- Product cards/listings: reflect the published product name and selected primary image, not an independent image source. Reflect lifecycle visibility consistently with product detail and purchase eligibility.
- Discontinued products: a published page may retain its story/media with a localized unavailable message and no purchase action. Until task 08 provides related products, link to an existing shop/category destination; do not add placeholder recommendations. Draft/unpublished content must not leak through public pages or metadata.
- SEO: use localized CMS SEO title/description with documented fallbacks in page metadata. Preserve the existing slug/routing concept; do not make a slug migration part of content presentation.
- CMS publication and subsequent edits must become visible through an explicit cache refresh/revalidation policy. A field existing in CMS or an adapter response is insufficient if the rendered storefront ignores it.

### Definition of done

- [ ] CMS edits flow through the adapter/public contracts to product detail, with distinct short and comprehensive descriptions.
- [ ] EN/ES accordions retain the same identity/order; incomplete translations and fallback behavior are explicit.
- [ ] Images and videos render with valid accessibility metadata and responsive behavior.
- [ ] Unsafe uploads/embeds and unpublished media/content access are tested according to the chosen publication policy.
- [ ] Active, discontinued, draft, missing-media, empty-accordion, and unavailable-backend states are covered.
- [ ] No internal notes or purchasing data appear in public content or media.
- [ ] A human can publish a fixture, edit its short/full descriptions, reorder media, change the primary image, rename/hide/add accordion sections, and observe each change in the storefront using the documented refresh policy.
- [ ] Product cards, detail gallery, information sections, lifecycle purchase controls, and localized SEO metadata consume the CMS values without parallel hard-coded content.
- [ ] EN/ES desktop/mobile and keyboard verification covers the complete rendered flow, including video failure, missing translation, empty sections, and discontinued/draft behavior. Record results in a manual checklist alongside this task.
- [ ] Migration, generated types, editor guide, desktop/mobile and both-locale verification are complete.

### Out of scope

Custom page builders per product, video transcoding infrastructure unless separately approved, and review submission.
