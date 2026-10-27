# ADR local — Mágico Commerce autónomo y frontera con Payload

- **Estado:** Límite de producto adoptado; implementación conforme a gates propios, no implica despliegue.
- **Fecha:** 2026-10-27
- **Alcance:** tienda-magico únicamente.
- **Visión canónica:** [THE MAGICO OS MASTERPLAN](https://experienciamagico.atlassian.net/wiki/spaces/VD/pages/54263809/THE+MAGICO+OS+MASTERPLAN).
- **ADRs transversales (revisión versionada):** [Índice global](https://github.com/pueblo-magico/magico-architecture/blob/076927d720af81ed198f990032a08493dd5e1667/docs/adr/README.md) · [magico-architecture/ADR-0001 Modular products](https://github.com/pueblo-magico/magico-architecture/blob/076927d720af81ed198f990032a08493dd5e1667/docs/adr/0001-modular-product-architecture.md) · [magico-architecture/ADR-0002 Dedicated deployments](https://github.com/pueblo-magico/magico-architecture/blob/076927d720af81ed198f990032a08493dd5e1667/docs/adr/0002-dedicated-installations.md) · [magico-architecture/ADR-0003 Identity/authorization](https://github.com/pueblo-magico/magico-architecture/blob/076927d720af81ed198f990032a08493dd5e1667/docs/adr/0003-identity-and-authorization.md) · [magico-architecture/ADR-0004 Module APIs/events](https://github.com/pueblo-magico/magico-architecture/blob/076927d720af81ed198f990032a08493dd5e1667/docs/adr/0004-module-integration-contract.md) · [magico-architecture/ADR-0005 OS Admin Center](https://github.com/pueblo-magico/magico-architecture/blob/076927d720af81ed198f990032a08493dd5e1667/docs/adr/0005-admin-center-ownership.md). Snapshot commit `076927d720af`, revisión en [magico-architecture PR #1](https://github.com/pueblo-magico/magico-architecture/pull/1) (draft, aún no merged). Masterplan mantiene autoridad estratégica; aquí sólo se registran límites locales.

## Decisión específica del repositorio

La aplicación storefront Next.js y CMS Payload se mantienen separados como componentes del producto Commerce. Commerce posee catálogo vendible, stock comercial, órdenes, checkout, pagos, fulfillment y permisos internos. La administración comercial funciona sin adquirir OS Core.

## Restricciones técnicas y consecuencias

No duplicar el inventario de noches, cotizaciones o reservas de Mágico Reservas. Mantener proveedores, costos privados y datos de pagos bajo autorización server-side. Las integraciones OS usan manifesto/API, nunca acceso directo a PostgreSQL. Mágico Sites es futuro y no implica migrar ahora a otro CMS. Mantener releases de Commerce independientes de los de OS/Reservas.

## Evidencia y ejecución

[TIENDA-72](https://experienciamagico.atlassian.net/browse/TIENDA-72) registra productización futura. El trabajo ecommerce activo y sus reglas específicas de AGENTS.md siguen vigentes.

## Historia

El Masterplan 27/10/2026 supersede el paquete OS Base obligatorio del 13/10 y el runtime multi-tenant como requisito v0.1. Esa historia permanece en Jira y Git; esta propuesta local aún es parte de una PR de documentación **sin merge**. Una modificación de contrato cross-product requiere ADR central más cambios explícitos en repos afectados; no repetir una ADR genérica como fuente de verdad en cada repo.
