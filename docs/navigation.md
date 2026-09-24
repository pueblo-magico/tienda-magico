# Storefront navigation

## Rutas de pago y caja

Las rutas públicas en español son `/es/pago`, `/es/pago/revision`, `/es/pago/pendiente`, `/es/pago/exito`, `/es/pago/error` y `/es/personal/caja`. En inglés se conservan `/en/checkout`, sus subrutas `review`, `pending`, `success`, `failure` y `/en/staff/cash`.

`paymentPathnames` es la fuente compartida por la navegación y next-intl. Los enlaces anteriores en español redirigen con 308 y conservan todos los parámetros. No cambian las rutas de API, webhooks ni cookies de caja. Las nuevas sesiones de pago generan URLs localizadas; los retornos anteriores siguen funcionando.

El selector de idioma conserva todos los parámetros de consulta al traducir la ruta, incluidos el pedido, el método de pago, el origen de navegación y los filtros repetidos del catálogo.

The store is the commerce experience for [Experiencia Mágico](https://experienciamagico.com/), not a separate brand. Its navigation intentionally combines shop-owned destinations with selected destinations on the main website.

## Navigation model

The shop header prioritizes commerce while preserving a clear path back to the broader Pueblo Mágico experience:

| Label                                       | Ownership    | Destination               |
| ------------------------------------------- | ------------ | ------------------------- |
| Tienda / Shop                               | Storefront   | Localized product catalog |
| Estadías / Stay                             | Main website | Stay and glamping page    |
| Experiencias / Experiences                  | Main website | Experiences section       |
| Nosotros / About                            | Main website | About section             |
| Visitar Pueblo Mágico / Visit Pueblo Mágico | Main website | Main homepage             |

The footer repeats these discovery links and points contact, terms, and privacy links to the main website. Routes that do not exist in the shop must not appear as internal links.

All brand-site destinations open in the same tab. They are part of the same customer journey, so they are not treated like unrelated third-party links.

## Configuration

Navigation is configured in `src/config/navigation.ts`. Components must consume that configuration instead of embedding destination URLs.

Each item has a `kind`:

- `internal` contains a locale-free storefront path such as `/shop`. `resolveNavigationHref` adds the active locale and translates known public path segments.
- `external` contains a complete URL. `resolveNavigationHref` returns it unchanged.

The canonical main-site origin lives in `externalSites`. Main-site destinations are built from that origin in the configuration, keeping domain changes centralized.

```ts
{
  kind: "internal",
  href: "/shop",
  labelKey: "nav.shop",
  label: { en: "Shop", es: "Tienda" },
}

{
  kind: "external",
  href: "https://experienciamagico.com/#experiencias",
  labelKey: "nav.experiences",
  label: { en: "Experiences", es: "Experiencias" },
}
```

The `labelKey` must exist in both `messages/en.json` and `messages/es.json`. The inline `label` values are configuration metadata and must remain consistent with those translations.

## Adding or changing a destination

1. Confirm whether the destination is owned by this storefront or the main website.
2. Add or update the item in `src/config/navigation.ts` with the correct `kind`.
3. For internal destinations, use the shared, locale-free route. Add translated segments to `localizedSegments` when the public path differs by locale.
4. For main-site destinations, build an absolute URL from the configured `externalSites.experienciaMagico` origin.
5. Add matching label translations for English and Spanish.
6. Verify desktop and mobile menus, the footer, both storefront locales, and the final destination.

Do not add placeholder internal navigation for planned pages. A link should be published only when its destination exists.

## Category URLs

Product URLs remain directly below the localized shop route. Category URLs use a
separate localized namespace so product and category slugs cannot collide:

```text
/es/tienda/cacao-ceremonial
/es/tienda/categorias/bienestar-y-rituales/cacao
/en/shop/cacao-ceremonial
/en/shop/categories/bienestar-y-rituales/cacao
```

Category handles are stable across locales. Each category URL contains the full
parent chain. Search, sorting, price, origin, availability, tags, and pagination
remain query parameters; the primary category scope does not.

Los segmentos de categoría se decodifican una sola vez al resolver la ruta. Los slugs con Unicode, como `montaña-y-regeneracion`, se conservan en los filtros y se codifican al generar enlaces (`monta%C3%B1a-y-regeneracion`). Una codificación inválida o una cadena padre-hijo inexistente devuelve 404; no se modifican los slugs del CMS.

# Cuenta de cliente

El menú del encabezado enlaza a `/es/mi-cuenta` o `/en/account`. Sin sesión ofrece Mis pedidos, Crear cuenta (`?mode=register`) e Ingresar. Con sesión ofrece Mis pedidos, Mis datos y Cerrar sesión. Las rutas y las traducciones se mantienen en la configuración compartida; el historial entre dispositivos y sus garantías se describen en [Cuentas opcionales](checkout/customer-accounts.md).
