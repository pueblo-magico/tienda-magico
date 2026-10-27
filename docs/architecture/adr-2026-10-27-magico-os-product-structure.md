# ADR 2026-10-27 — Mágico OS modular y tienda-magico

**Estado:** Aceptada (arquitectura), no release. [Masterplan canónico](https://experienciamagico.atlassian.net/wiki/spaces/VD/pages/54263809/THE+MAGICO+OS+MASTERPLAN). [Jira MAGOS-111](https://experienciamagico.atlassian.net/browse/MAGOS-111).

## Arquitectura modular vigente (Masterplan v1.1)
1. Mágico OS = ecosistema de productos **independientes, comprables y deployables**. Single-tenant dedicado por organización como default, mismo artefacto/versionado para distintos clientes sin forks. El módulo no requiere instalar OS.
2. **OS Core = Shell + Admin Center local** de una organización (módulos habilitados, contexto, usuarios OS, domains, integraciones, health/auditoría); no panel global del proveedor ni Admin de negocio de los módulos. Cada módulo conserva su Admin, permisos, base y API propias.
3. **Domain** = workspace operativo (Refugio, Huerta, Cocina, Predio) que puede componer capacidades de varios módulos. No es módulo vendible. **Mágico Operaciones** = app web/nativa staff on-site, no OS Shell ni futura app huésped/miembro **Mágico Companion**.
4. Sitios existentes (magico-web, SOMA) integran por hosted checkout/deep links/API/webhooks. Mágico Sites es producto website/CMS opcional futuro. CMS editorial/SEO no es la fuente de verdad de disponibilidad, reserva o pago.
5. Auth OIDC (issuer + sub → magicoUserId) autentica, pero cada producto autoriza permisos de su dominio. Sin cookies, secretos, base de datos o permisos compartidos entre módulos. Contratos de eventos/API versionados, accesos mínimos, auditoría y rollback.
6. **Ahora:** Reservas v0.1 mismo artefacto, dos instalaciones dedicadas Pueblo/SOMA. **Próximo post-v0.1:** Reservas Events/Retreats v0.2, Memberships/Subscriptions y beneficiarios a definir. **Futuro sin tickets ahora:** Finance, Insights, Learning (cursos/clases), Companion (free/paid + guía on-site), Sites. No confundir membresía de usuario final con licencia/subscripción B2B del proveedor Mágico.

## Límite local
- **Propiedad:** Commerce storefront/checkout, catálogo vendible, órdenes, pagos del comercio, fulfillment, proveedores y costos privados; Payload editorial/CMS según límites propios.
- **No pertenece:** inventario y precio cotizado de Reservas, Admin Center OS, Memberships, Finance, Learning.
- **Nota de implementación:** Conservar storefront y Payload separados, respetar modelos actuales. Venta autónoma Commerce sin OS Base; Mágico Sites opcional no significa migrar tienda a nuevo CMS.

## Historia y precedencia de ADR
- 08/10: [límites dominios y Events v0](https://experienciamagico.atlassian.net/wiki/spaces/VD/pages/42401795); fuente de verdad por módulo permanece.
- 13/10: [MAGOS-99](https://experienciamagico.atlassian.net/browse/MAGOS-99) adoptó bundle OS Base+Bookings; [WRESERV-50](https://experienciamagico.atlassian.net/browse/WRESERV-50) pasó de managed Bookings standalone a módulo OS obligatorio.
- 20/10: SOMA piloto externo y branding/checkout alojado.
- 26/10: [Reservas PR #2](https://github.com/pueblo-magico/magico-reservas/pull/2) exploró multitenancy compartida; snapshot preservado en branch `archive/multitenant-mvp-2026-10-26` (a358fa3), sin Go.
- 27/10: Masterplan v1.1 supersede OS Base obligatorio y shared tenancy de v0.1, sin borrar decisiones anteriores. [ADR detallado del deployment dedicado](https://github.com/pueblo-magico/magico-reservas/blob/codex/modular-dedicated-v0.1/docs/architecture/adr-2026-10-27-modular-dedicated-installations.md).

**Cambio cross-repo:** registrar ADR versionado en código y comentario de impacto en Jira, actualizar Masterplan. No crear issues para visión lejana; no desplegar, tocar producción o marcar Done sin evidencia/aceptación.
