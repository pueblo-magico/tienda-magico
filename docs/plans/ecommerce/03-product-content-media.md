# 03 — Product content, media, and editable information sections

Status: planned. Depends on: 01, 02.

## Codex implementation prompt

Implement rich bilingual product information and its product-detail presentation. Follow `docs/plans/ecommerce/README.md`.

### Feature request

Organize CMS product editing into clear content/classification/media/merchandising tabs, preserving plugin fields. Provide EN/ES name, short description, comprehensive safe rich text, SEO title/description, country code, localized region/community and public origin story. Keep created/updated dates system-managed and first-published date distinct from creation.

Separate editorial draft/publish state from active/discontinued lifecycle. Define discontinued-page behavior: no purchase, but a published page can remain available with alternatives. Show translation readiness without relying on fallback to pretend translation is complete; require critical name/short purchase copy in both locales before initial publication. Handle legacy products through an explicit migration/grace policy.

Extend public product media to ordered images and supported videos, primary image selection, localized alt/caption, and video poster. Enforce upload MIME/size rules, safe delivery, keyboard-accessible controls, and no autoplay with sound. Do not accept arbitrary embed HTML. Public Media must not become storage for private invoices or supplier documents.

Implement shared-structure accordion entries with stable key, localized editable title/body, order, and visibility. Provide editable initial templates for ingredients, how-to-use, origin/impact, and care; support custom entries. Templates populate new content without overwriting existing edits. Hide empty sections. Use the existing safe rich-text renderer and extend supported nodes deliberately.

### Definition of done

- [ ] CMS edits flow through the adapter/public contracts to product detail, with distinct short and comprehensive descriptions.
- [ ] EN/ES accordions retain the same identity/order; incomplete translations and fallback behavior are explicit.
- [ ] Images and videos render with valid accessibility metadata and responsive behavior.
- [ ] Unsafe uploads/embeds and unpublished media/content access are tested according to the chosen publication policy.
- [ ] Active, discontinued, draft, missing-media, empty-accordion, and unavailable-backend states are covered.
- [ ] No internal notes or purchasing data appear in public content or media.
- [ ] Migration, generated types, editor guide, desktop/mobile and both-locale verification are complete.

### Out of scope

Custom page builders per product, video transcoding infrastructure unless separately approved, and review submission.
