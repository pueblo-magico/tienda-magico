# 03 — Product content, media, and editable information sections

Status: in progress — content-rendering and public catalog-read foundations implemented; the feature is not complete. Depends on: 01, 02.

## Implementation progress

### Avance: descripción enriquecida en la ficha de producto

Se conectó el resumen del CMS con los controles de compra y la descripción
completa con el acordeón, usando un único componente compartido de tipografía.
El HTML permitido se genera en el adaptador y se identifica con un tipo específico;
el componente no acepta cadenas HTML arbitrarias. Los campos vacíos se omiten y
el resumen no sustituye la descripción completa. Se agregó un ejemplo al sistema
de diseño y etiquetas más claras en el CMS. No requiere migración.

Verificación: 32 pruebas de catálogo y TypeScript pasan. En el navegador integrado
se abrió el acordeón de Tambor en ES y EN y se confirmó la estructura de párrafos
y títulos del contenido existente. Quedan pendientes la matriz de anchos de
pantalla, navegación completa por teclado y las demás funcionalidades de esta tarea.

- Follow-up: CMS publication guards require an eligible published variant for variant-enabled products and protect the last eligible variant from removal/invalidation. Simple publication requires valid enabled ARS pricing. Zero stock is allowed. Four hook regression tests pass; no schema migration or automatic data update. Product-page missing-variant copy now says product unavailable in EN/ES rather than blaming cart configuration. Live admin/browser verification remains pending.

- The Payload commerce adapter now reuses the canonical CMS rich-text serializer. Plain strings are escaped, supported Lexical formatting is retained, unsafe link protocols are omitted, and inline text preserves word spacing.
- Product list, slug, ID, and category product projections require explicit published status, including when upstream requests authenticate with an API key. Missing status fails closed. Product ID lookup preserves operational failures instead of treating them as missing content.
- Automated coverage: catalog suite passes 31 tests, including seven new content/publication tests. Storefront lint passes with existing warnings; TypeScript validation and production build pass.
- No schema, migration, slugs, editor UI, media policy, or purchase flow changed in this foundation step. CMS tabs/fields, translation readiness, editable sections, gallery/video presentation, lifecycle enforcement, and their migrations and end-to-end verification remain outstanding.
- Manual verification instructions: [Task 03 manual test](03-product-content-media-manual-test.md). These tests have not yet been executed against a live CMS.

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
- SEO: use localized CMS SEO title/description with documented fallbacks in page metadata. Each product keeps one stable slug shared between EN/ES; translating or renaming content must not regenerate it. Preserve existing routes; no slug migration is part of content presentation.
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
