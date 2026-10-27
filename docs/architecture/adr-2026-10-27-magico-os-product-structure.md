# ADR local — Mágico Commerce autónomo y frontera con Payload

- **Estado:** Límite de producto adoptado; implementación conforme a gates propios, no implica despliegue.
- **Fecha:** 2026-10-27
- **Alcance:** tienda-magico únicamente.
- **Visión canónica:** [THE MAGICO OS MASTERPLAN](https://experienciamagico.atlassian.net/wiki/spaces/VD/pages/54263809/THE+MAGICO+OS+MASTERPLAN).
- **ADRs de plataforma:** Se centralizarán en `pueblo-magico/magico-architecture/docs/adr` (repositorio aún **pendiente de creación**): **magico-architecture/ADR-0001** módulos, **ADR-0002** instalaciones dedicadas, **ADR-0003** Auth/autorización, **ADR-0004** contratos de integración, **ADR-0005** Admin Center. Mientras no estén publicados, el Masterplan y este ADR local son la referencia; no seguir enlaces de repositorio inexistente.

## Decisión específica del repositorio

La aplicación storefront Next.js y CMS Payload se mantienen separados como componentes del producto Commerce. Commerce posee catálogo vendible, stock comercial, órdenes, checkout, pagos, fulfillment y permisos internos. La administración comercial funciona sin adquirir OS Core.

## Restricciones técnicas y consecuencias

No duplicar el inventario de noches, cotizaciones o reservas de Mágico Reservas. Mantener proveedores, costos privados y datos de pagos bajo autorización server-side. Las integraciones OS usan manifesto/API, nunca acceso directo a PostgreSQL. Mágico Sites es futuro y no implica migrar ahora a otro CMS. Mantener releases de Commerce independientes de los de OS/Reservas.

## Evidencia y ejecución

[TIENDA-72](https://experienciamagico.atlassian.net/browse/TIENDA-72) registra productización futura. El trabajo ecommerce activo y sus reglas específicas de AGENTS.md siguen vigentes.

## Historia

El Masterplan 27/10/2026 supersede el paquete OS Base obligatorio del 13/10 y el runtime multi-tenant como requisito v0.1. Esa historia permanece en Jira y Git; esta propuesta local aún es parte de una PR de documentación **sin merge**. Una modificación de contrato cross-product requiere ADR central más cambios explícitos en repos afectados; no repetir una ADR genérica como fuente de verdad en cada repo.
