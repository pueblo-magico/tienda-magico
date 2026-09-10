# Task 03 — manual verification

Status: not run. Task 03 is partially implemented; this checklist currently covers the content/publication foundation only, not the full definition of done.

## Setup

Usá un CMS y storefront local o de prueba, nunca contenido de producción. Respaldá
PostgreSQL y aplicá primero las migraciones anteriores, incluida la de taxonomía.
Luego aplicá `20260908_041909_task_03_product_content_media` antes de iniciar el CMS
 y `20260910_143311_task_03_origin_seo` antes de iniciar el CMS con este esquema.
Usá un producto publicado y otro borrador, con slugs distintos y
títulos reconocibles en ES/EN. No compartas claves, cookies ni datos personales en
los resultados.

La migración conserva productos y filas existentes. Las filas antiguas no quedan
marcadas como principales, por lo que la tienda continúa usando el primer medio.
No crea secciones ni inventa traducciones para productos existentes.

Product responses retain the existing 60-second revalidation policy. After publishing or changing publication status, wait at least 60 seconds and request the page again; a subsequent request may be needed after background revalidation. Restarting the local server alone is not evidence that the production cache refresh policy works.

## Public catalog and metadata

## Editor, origen público y SEO

- [ ] En el editor de un producto, confirmá las pestañas **Contenido**,
      **Clasificación y origen**, **Medios** y **Venta e inventario**. Guardá
      el producto y comprobá que los valores existentes no cambiaron de ruta.
- [ ] Completá país con un código ISO de dos mayúsculas (AR/BR), región,
      comunidad e historia en ES y EN. Un código inválido debe rechazarse.
- [ ] En la ficha ES y EN, verificá un solo acordeón **Origen e impacto** con
      los datos públicos y la historia en el idioma activo (con fallback
      documentado). No deben aparecer costos, proveedor ni notas internas.
- [ ] Si existe una sección legada `origin-impact` y también una historia
      nueva, confirmá que no se muestran dos historias separadas.
- [ ] Completá título y descripción SEO distintos en ES/EN, una imagen OG y
      `noindex`; tras la revalidación, confirmá metadata, imagen y robots en
      cada locale.

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
- [ ] Sin cargar ninguna imagen en la fila, comprobá que aparezca automáticamente la miniatura generada por YouTube. Si agregaste una imagen en la misma fila, comprobá que se use como poster o miniatura editorial en su lugar. El caption debe respetar ES/EN.
- [ ] Verificá que los parámetros de la URL original no habiliten autoplay ni cambien el host permitido. No se deben renderizar iframes arbitrarios.
- [ ] Con una URL borrada o un video privado, la ficha debe conservar su estructura y mostrar el error propio del reproductor; no debe romper la página ni ocultar otras imágenes.

### Preparación

- [ ] Usá un entorno local o de prueba y contenido que no incluya datos privados.
- [ ] Prepará una imagen JPG o WebP, una segunda imagen PNG, un video MP4 o WebM
      corto y, opcionalmente, una imagen JPG para usar como poster editorial. Para
      YouTube no hace falta preparar ni cargar una miniatura: se genera automáticamente.
      No uses archivos con información personal ni material sujeto a derechos que no correspondan.
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
- [ ] En imágenes recortadas o con distintas proporciones, la parte superior del
      medio queda alineada con el borde superior de la galería, tanto en miniaturas
      como en el medio principal.
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

### Migración y rollback

- [ ] En una base descartable que tenga las migraciones anteriores, ejecutá la
      migración y confirmá que el CMS inicia sin activar `push` de esquema.
- [ ] Abrí un producto anterior: debe conservar medios, slug y estado; sin una marca
      principal, el primer medio debe seguir siendo el fallback.
- [ ] Guardá captions ES/EN, secciones, prioridad y un video externo; reiniciá CMS y
      storefront y confirmá que persisten.
- [ ] Hacé backup de esa base descartable y ejecutá el rollback. Confirmá que elimina
      secciones, captions, prioridad y URLs externas, pero conserva los productos y
      la galería de imágenes original.
- [ ] Volvé a aplicar la migración y repetí una lectura pública. Nunca pruebes el
      rollback sobre datos que necesites conservar.

Resultado automatizado: la cadena completa se aplicó en una base PostgreSQL
descartable. Se verificaron tablas, columnas y registro de Task 03. En una segunda
base descartable se ejecutó su rollback aislado y se confirmó que productos y
taxonomía permanecen mientras las estructuras de Task 03 se eliminan. Ambas bases
de prueba se borraron. Sigue pendiente la comprobación humana del contenido antes
y después de reiniciar los servicios.

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
El guard de publicación no migra ni modifica productos automáticamente; la
migración de contenido/media descripta arriba es un cambio separado.

Verification: four hook tests and 38 catalog tests pass; storefront and CMS
production builds pass. Storefront lint passes with existing warnings. Full CMS
lint retains two existing anchor-element errors in its frontend page and 13
warnings. HTTP checks observed the new unavailable message on EN; the ES response
showed an add-to-cart state instead, so it did not verify the unavailable case.
Admin mutation and desktop/mobile keyboard tests above remain unexecuted.

## Funcionalidad todavía pendiente

Organización del editor en pestañas, preparación de traducciones, datos públicos
de origen, ciclo activo/discontinuado, límites de tamaño de uploads y estados de
carga/error. También queda ejecutar la prueba de migración/rollback y completar
la matriz manual de escritorio, móvil, teclado y ambos idiomas.
