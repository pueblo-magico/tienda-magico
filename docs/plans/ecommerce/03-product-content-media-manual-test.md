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

## Secciones de información

- [ ] En un producto publicado, editá título y contenido de una sección en ES y EN; verificá que la misma clave conserve el orden.
- [ ] Agregá una sección personalizada, ocultá otra y dejá una tercera vacía; después de la revalidación solo deben aparecer las visibles y completas.
- [ ] Intentá repetir o cambiar una clave estable guardada; el CMS debe rechazarla con un mensaje localizado.
- [ ] Cambiá solo el título o el orden; debe guardarse sin modificar el identificador.
- [ ] Confirmá que notas internas, costos y datos de proveedores no estén dentro del contenido público.

## Galería de imágenes y videos

### Video externo de YouTube

- [ ] En una fila de galería sin imagen, ingresá una URL HTTPS de `youtube.com/watch?v=...`, `youtu.be/...` o `youtube.com/shorts/...`.
- [ ] Guardá y publicá; el CMS debe aceptar el enlace y rechazar hosts externos, HTTP sin TLS, código `<iframe>`, URLs `javascript:` o URLs sin ID.
- [ ] Abrí la ficha y seleccioná la miniatura: debe mostrarse el reproductor embebido de `youtube-nocookie.com`, con título accesible y sin autoplay.
- [ ] Si agregaste una imagen en la misma fila, comprobá que se use como poster o miniatura editorial. El caption debe respetar ES/EN.
- [ ] Verificá que los parámetros de la URL original no habiliten autoplay ni cambien el host permitido. No se deben renderizar iframes arbitrarios.
- [ ] Con una URL borrada o un video privado, la ficha debe conservar su estructura y mostrar el error propio del reproductor; no debe romper la página ni ocultar otras imágenes.

### Preparación

- [ ] Usá un entorno local o de prueba y contenido que no incluya datos privados.
- [ ] Prepará una imagen JPG o WebP, una segunda imagen PNG, un video MP4 o WebM
      corto y una imagen JPG para usar como poster. No uses archivos con información
      personal ni material sujeto a derechos que no correspondan.
- [ ] Confirmá que el CMS y el storefront estén configurados y que el producto de
      prueba tenga un slug compartido válido. Publicá el producto después de guardar.

### CMS: carga y configuración

- [ ] En **Media**, cargá los formatos permitidos: JPG, PNG, WebP, AVIF, MP4 y WebM.
- [ ] Verificá que el CMS rechace al menos un formato no permitido (por ejemplo,
      SVG, GIF, MOV o un archivo ejecutable). No fuerces la carga mediante la API.
- [ ] En la galería del producto, agregá dos imágenes y un video. Ordenalos en un
      orden reconocible, marcá una imagen que no sea la primera como **Imagen principal**
      y guardá.
- [ ] Completá pies de foto distintos en ES y EN. En el video asigná el poster y
      completá texto alternativo localizado para cada medio.
- [ ] Guardá sin marcar ningún medio como principal y comprobá que el primer medio
      publicado se use como fallback. No marques más de uno como principal; si el CMS
      permite guardarlo, registrá el comportamiento como un defecto para corregir.
- [ ] Publicá el producto. Un producto borrador y sus metadatos no deben aparecer
      en la tienda pública.

### Storefront: orden, selección y accesibilidad

- [ ] Abrí la ficha en ES y en EN después del intervalo de revalidación documentado.
      La miniatura/medio principal debe ser el marcado en el CMS y el resto debe
      conservar el orden configurado.
- [ ] Seleccioná cada miniatura con el mouse y con `Tab` + `Enter` o `Space`. El
      medio activo debe cambiar y el foco debe permanecer visible.
- [ ] La imagen muestra su texto alternativo; el pie de foto coincide con el
      idioma activo. No debe mostrarse información de proveedor, costo o notas internas.
- [ ] Seleccioná el video: no debe reproducirse automáticamente ni emitir sonido.
      Debe mostrar el poster antes de reproducir y ofrecer controles nativos de pausa,
      volumen y pantalla completa.
- [ ] Reproducí el video y verificá que la navegación por teclado del navegador y
      los controles nativos funcionen. Al volver a una imagen, esta debe recuperar su
      texto alternativo y pie correcto.
- [ ] Simulá un video inaccesible o quitá temporalmente el archivo en el entorno de
      prueba: la ficha debe conservar la galería y mostrar un estado de error/reintento
      comprensible, sin romper el resto de la página. Registrá si el backend devuelve
      un 404 o un MIME inválido.
- [ ] Probá un producto sin medios: debe aparecer el fallback deliberado y la ficha
      debe seguir siendo usable.
- [ ] Probá escritorio y móvil, orientación vertical y horizontal, sin desbordes ni
      miniaturas inaccesibles. Repetí la selección completa con teclado.

### Caché y seguridad

- [ ] Cambiá el orden, el principal y un pie en el CMS; verificá que el storefront
      refleje cada cambio después de la revalidación. No concluyas que reiniciar el
      navegador prueba la invalidación de producción.
- [ ] Inspeccioná la respuesta pública y el HTML: solo aparecen URL, alt, poster,
      caption y datos necesarios para presentar el medio. No aparecen tokens, rutas
      privadas, facturas ni credenciales.
- [ ] Confirmá que una URL `data:` o `blob:` no se renderice como fuente de media.

Resultado: no ejecutado todavía. La proyección automatizada de imágenes, videos,
poster y caption está cubierta por la suite de catálogo; la carga real, los fallos
de reproducción y la matriz responsive/teclado requieren ejecución manual.

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
