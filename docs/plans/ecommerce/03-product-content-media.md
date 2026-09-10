# 03 — Product content, media, and editable information sections

Status: in progress — content-rendering and public catalog-read foundations implemented; the feature is not complete. Depends on: 01, 02.

### Avance: ciclo de vida activo/discontinuado

El CMS permite marcar un producto como `Activo` o `Discontinuado`. Un producto
discontinuado publicado conserva su ficha y contenido público, pero se expone
como no comprable y los controles de compra quedan deshabilitados. La migración
`20260910_170000_task_03_lifecycle` agrega el estado a productos y versiones,
con `active` como valor compatible para registros existentes.

## Implementation progress

### Avance: preparación mínima de traducciones

La primera publicación de productos nuevos valida que nombre y descripción
corta estén completos en español e inglés. Los documentos antiguos sin esos
campos conservan una política de compatibilidad: pueden seguir editándose y
usan el fallback público configurado. La validación se ejecuta junto con las
protecciones existentes de variantes y precio ARS; no cambia slugs ni datos
persistidos.

### Avance: editor organizado y origen/SEO públicos

El editor de productos ahora agrupa los campos en pestañas de Contenido,
Clasificación y origen, Medios, y Venta e inventario. Las pestañas son solo de
presentación: conservan las rutas existentes del plugin para no romper datos ni
integraciones. Se agregaron código de país ISO compartido, región, comunidad e
historia pública de origen localizados, además del grupo SEO localizado (título,
descripción, imagen y noindex).

La ficha muestra origen, región y comunidad dentro de un único acordeón de
Origen e impacto. La historia nueva tiene prioridad sobre el cuerpo legado de
esa sección para evitar duplicados. El SEO localizado alimenta metadata,
Open Graph y noindex; costos, proveedores y otros campos operativos no cruzan
el contrato público. La migración `20260910_143311_task_03_origin_seo` agrega
las columnas y referencias necesarias para productos y versiones.

### Avance: imagen principal consistente en la tienda

Las tarjetas, la ficha y las proyecciones del carrito reutilizan la selección
ordenada de medios del adaptador. La marca de medio principal tiene prioridad;
los videos aportan su poster o miniatura de YouTube, nunca el archivo de video
como fuente de una imagen. Un video sin poster se omite al seleccionar imágenes.
Se conservan las fuentes antiguas como fallback. Este cambio no modifica el
esquema ni requiere migración. Pruebas de catálogo: 38 aprobadas; queda pendiente
verificar visualmente las tarjetas y el carrito con contenido real en ES/EN.

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

### Avance: secciones de información editables

El CMS ahora ofrece una matriz bilingüe de secciones con clave estable, título,
contenido enriquecido, visibilidad y orden. Las cuatro plantillas iniciales son
ingredientes y materiales, cómo usar, origen e impacto y cuidados; también se
pueden agregar claves personalizadas. El adaptador conserva el orden, aplica el
fallback configurado, descarta filas ocultas/vacías y entrega únicamente contenido
público al acordeón compartido de la ficha. Cambiar una clave ya guardada se
rechaza para preservar referencias estables; cambiar su título no.

La matriz localizada requiere persistencia propia en PostgreSQL. La migración de
Task 03 agrega sus tablas para productos y versiones; los tipos y el snapshot del
esquema se generan con Payload.

### Avance: galería de imágenes y videos

Las cargas del CMS tienen límites explícitos: 10 MB por imagen y 100 MB por
video. La validación se ejecuta del lado del servidor tanto desde el editor como
desde la API y devuelve un mensaje en el idioma activo.

La galería del CMS ahora acepta imágenes JPG/PNG/WebP/AVIF y videos MP4/WebM,
con pie localizado y marca de medio principal. El adaptador proyecta el orden
editorial, poster y texto alternativo; el storefront muestra miniaturas y un
reproductor de video con controles, `preload="metadata"` y sin autoplay. No se
aceptan URLs `data:` o `blob:` ni tipos MIME fuera de la lista.

Verificación: 38 pruebas de catálogo, TypeScript, formato y diff pasan. La
validación de contenido real, errores de reproducción y verificación manual
responsive/teclado siguen pendientes.

También se admiten videos externos de YouTube mediante una URL HTTPS validada
(`youtube.com`, `youtu.be` o Shorts). El adaptador genera únicamente el embed de
`youtube-nocookie.com`; no se aceptan iframes arbitrarios ni autoplay. Si la fila
no tiene imagen, el storefront genera la miniatura desde `i.ytimg.com`; una imagen
opcional de la fila funciona como poster/miniatura editorial y tiene prioridad.
Las imágenes de la galería se presentan con alineación superior. Las columnas y
tablas necesarias forman parte de la migración de Task 03.

Verificación adicional: 38 pruebas de catálogo pasan; el build de storefront,
TypeScript y el formato de los archivos modificados pasan. La prueba en el
navegador y la administración para editar/reordenar secciones aún queda pendiente.

- Follow-up: CMS publication guards require an eligible published variant for variant-enabled products and protect the last eligible variant from removal/invalidation. Simple publication requires valid enabled ARS pricing. Zero stock is allowed. Four hook regression tests pass; no schema migration or automatic data update. Product-page missing-variant copy now says product unavailable in EN/ES rather than blaming cart configuration. Live admin/browser verification remains pending.

- The Payload commerce adapter now reuses the canonical CMS rich-text serializer. Plain strings are escaped, supported Lexical formatting is retained, unsafe link protocols are omitted, and inline text preserves word spacing.
- Product list, slug, ID, and category product projections require explicit published status, including when upstream requests authenticate with an API key. Missing status fails closed. Product ID lookup preserves operational failures instead of treating them as missing content.
- Automated coverage: catalog suite passes 38 tests. Storefront lint passes with existing warnings; TypeScript validation and production build pass.
- La galería ya incluye campos de media, validación de videos externos y miniaturas de YouTube generadas; la verificación end-to-end del CMS sigue pendiente.
- Manual verification instructions: [Task 03 manual test](03-product-content-media-manual-test.md). These tests have not yet been executed against a live CMS.

### Avance: migración de contenido y media

`20260908_041909_task_03_product_content_media` registra captions localizados,
secciones editables, prioridad de media y URLs externas tanto en productos como
en sus versiones. Conserva las filas existentes y deja `isPrimary` en falso, de
modo que el primer medio continúa como fallback. El rollback elimina los datos de
estos campos y conserva los productos y su galería original; por eso solo debe
probarse sobre una base descartable respaldada. El snapshot generado queda como
base para futuras migraciones. La migración aparece pendiente en `migrate:status`;
no se aplicó automáticamente sobre la base local. La cadena completa y el rollback
de Task 03 se verificaron en bases PostgreSQL descartables; productos y taxonomía
permanecieron después del rollback. También se corrigió el orden de migraciones
para crear el enum ARS antes de asignarlo como valor por defecto en bases nuevas.

## Codex implementation prompt

Implement rich bilingual product information and its product-detail presentation. Follow `docs/plans/ecommerce/README.md`.

### Feature request

Organize CMS product editing into clear content/classification/media/merchandising tabs, preserving plugin fields. Provide EN/ES name, short description, comprehensive safe rich text, SEO title/description, country code, localized region/community and public origin story. Keep created/updated dates system-managed and first-published date distinct from creation.

Separate editorial draft/publish state from active/discontinued lifecycle. Define discontinued-page behavior: no purchase, but a published page can remain available with alternatives. Show translation readiness without relying on fallback to pretend translation is complete; require critical name/short purchase copy in both locales before initial publication. Handle legacy products through an explicit migration/grace policy.

Extend public product media to ordered images and supported videos, primary image selection, localized alt/caption, and video poster. Enforce upload MIME/size rules, safe delivery, keyboard-accessible controls, and no autoplay with sound. Do not accept arbitrary embed HTML. Public Media must not become storage for private invoices or supplier documents.

Implement shared-structure accordion entries with stable key, localized editable title/body, order, and visibility. Provide editable initial templates for ingredients, how-to-use, origin/impact, and care; support custom entries. Templates populate new content without overwriting existing edits. Hide empty sections. Use the existing safe rich-text renderer and extend supported nodes deliberately.

### Required storefront representation

- Product detail: show localized name and short description near the purchase controls, comprehensive content in the main description area, and public origin/region/community information in an appropriate information section. Avoid repeating the same story in multiple blocks; never show purchasing/internal fields.
- Media gallery: render the CMS-defined order and primary image, allow image/video selection, and use localized alt text/captions and video posters (including generated YouTube thumbnails). Align cropped media to the top. Include keyboard controls, responsive layouts, loading/failure placeholders, and a deliberate no-media fallback. No autoplay with sound.
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
