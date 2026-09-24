# Configuración pública del storefront

## Campos conectados

- `site-settings`: nombre, lema, logo, imagen principal de tienda, teléfono, email y redes sociales.
- `header.logo`: reemplaza el logo general en el encabezado y menú móvil. Si falta, se usa `site-settings.logo`; si la imagen no carga, se usa el SVG incluido en el storefront.
- `seo`: título predeterminado, plantilla con `%s`, descripción, imagen social, cuenta de Twitter y directivas de robots.

Los metadatos específicos de cada página o producto tienen prioridad sobre los globales. Sin contenido del CMS se conservan los textos locales. Carrito, cuenta, pedidos y checkout no se indexan. `defaultLocale` no modifica el enrutamiento; el favicon sigue siendo un recurso independiente. Los menús y el global `footer` quedan fuera de este cambio (TIENDA-18).

## Configuración y actualización

`PAYLOAD_CMS_URL` identifica el backend. Configurá `CMS_MEDIA_ORIGIN` (o `NEXT_PUBLIC_CMS_URL`) con el origen público de sus imágenes, por ejemplo `https://cms.example.com`. Nunca uses un hostname de contenedor como origen público. Las URLs de imágenes que apuntan al backend se convierten al origen público; los enlaces aceptan únicamente HTTP/HTTPS sin credenciales.

Los globals se consultan con `no-store`: una nueva solicitud al servidor obtiene los cambios, sin reconstrucción. Una pestaña ya abierta puede necesitar recarga. Las solicitudes al CMS tienen un límite de diez segundos; si fallan, se registra una advertencia sin datos sensibles y se usan los respaldos. El logo se sirve sin optimización de Next para permitir cambios de origen en ejecución. No hay cambios de esquema ni migración.

## Verificación manual

1. Cambiá nombre, lema, contacto y redes en el CMS; recargá `/es/tienda` y `/en/shop` y verificá el pie.
2. Configurá ambos logos: el del encabezado debe ganar en escritorio y móvil. Quitalo para verificar el logo general; probá una URL rota para verificar el SVG local.
3. Configurá SEO global y verificá el HTML: título, descripción, Open Graph, Twitter y `lang`. Comprobá que los metadatos de producto mantengan prioridad.
4. Verificá `noindex, nofollow` en carrito, checkout, cuenta y pedidos.
5. Sin CMS disponible, verificá los respaldos locales y navegación por teclado en ambos tamaños.
