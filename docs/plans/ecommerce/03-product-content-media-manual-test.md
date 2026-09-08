# Task 03 — manual verification

Status: not run. Task 03 is partially implemented; this checklist currently covers the content/publication foundation only, not the full definition of done.

## Setup

Use a local/test CMS and storefront, never production content. This foundation step has no database migration. Keep any existing taxonomy migrations applied. Use an existing published fixture and a separate draft fixture, with distinct slugs and recognizable EN/ES titles. Do not share API keys, cookies, or customer data in test results.

Product responses retain the existing 60-second revalidation policy. After publishing or changing publication status, wait at least 60 seconds and request the page again; a subsequent request may be needed after background revalidation. Restarting the local server alone is not evidence that the production cache refresh policy works.

## Public catalog and metadata

- [ ] In both EN and ES, the published product appears in the shop and its category. Its shared slug resolves to the same product.
- [ ] The draft product is absent from shop/category results. Its detail URL and document-ID URL do not expose its title, description, or SEO metadata.
- [ ] Repeat the draft checks with the storefront's optional test API key configured. Administrative upstream access must not expose draft products through the public storefront.
- [ ] A nonexistent product returns the normal missing-product view.
- [ ] With the backend unavailable, verify an operational error is reported rather than quietly presenting a missing product as the cause.

## Rich-text rendering

### Verificación de la ficha de producto

1. En un producto de prueba, completá **Descripción corta** con una frase y
   **Descripción completa** con dos párrafos, un título, una lista, negrita,
   cursiva y un enlace HTTPS. Publicá.
2. Después de la revalidación, comprobá que junto al precio aparezca solo la frase.
3. Abrí **Descripción**: debe mostrar la estructura y los estilos del texto completo.
4. Repetí en ES y EN. Si falta EN, comprobá el fallback configurado a ES.
5. Vaciar el resumen debe quitar solo el texto junto al precio. Vaciar la
   descripción completa debe quitar solo su acordeón, sin repetir el resumen.
6. Repetí en escritorio y móvil, abriendo y cerrando el acordeón con teclado.

Resultado ejecutado: acordeón de Tambor abierto en ambos idiomas en el navegador
integrado; se confirmó el título enriquecido y los párrafos existentes. No se
modificó el producto. La matriz completa anterior sigue pendiente.

- [ ] On a CMS-driven page using the shared rich-text renderer, verify paragraphs, headings, lists, bold, italic, and ordinary HTTPS links still render.
- [ ] Text containing `<script>` or `<img onerror=...>` as plain text is displayed literally, not interpreted as HTML. Use only harmless test text; do not execute attack scripts.
- [ ] In a test-only Lexical fixture, a link with a `javascript:` or `data:` URL renders its label without an actionable link. HTTPS, same-origin absolute paths, anchor links, email and telephone links remain supported.
- [ ] In both locales, adjacent formatted spans remain part of the same sentence; distinct paragraphs are separated in plain-text projections.

The automated catalog suite covers the unsafe URL/string fixtures without requiring the editor to accept invalid input. Do not weaken editor validation to construct these manual tests.

## Variant publication guard regression (manual: not run)

- [ ] Save a new variant-enabled product as draft with no variants: allowed.
- [ ] Publish it without published variants: field validation explains the missing variant/ARS price.
- [ ] Publish a linked variant with ARS enabled and a valid price, stock zero; publish the parent: allowed, storefront shows sold out.
- [ ] With only one eligible variant, try unpublishing, deleting, moving it or disabling its ARS price: blocked.
- [ ] Publish a second eligible variant; removing the first is allowed.
- [ ] Unpublish the parent; removing the remaining variant is allowed.
- [ ] Switch to simple mode: publication requires the parent's own enabled ARS price.
- [ ] Verify Tambor in EN/ES on desktop/mobile: “Product unavailable” / “Producto no disponible”, disabled purchase button, no misleading cart configuration warning when cart is configured.

Automated hook checks: `node --test tests/product-publication.test.mjs`.
No migration or automatic change to existing products is made.

Verification: four hook tests and 31 catalog tests pass; storefront and CMS
production builds pass. Storefront lint passes with existing warnings. Full CMS
lint retains two existing anchor-element errors in its frontend page and 13
warnings. HTTP checks observed the new unavailable message on EN; the ES response
showed an add-to-cart state instead, so it did not verify the unavailable case.
Admin mutation and desktop/mobile keyboard tests above remain unexecuted.

## Still to add when implementation lands

CMS tabs, short/full description presentation, translation readiness, editable ordered sections, origin data, primary-image selection, supported videos/posters, upload policy, lifecycle purchase enforcement, migrations and rollback, and desktop/mobile keyboard/failure-state checks.
