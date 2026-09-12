# 12 — Validación de lanzamiento ecommerce y handoff operativo

Estado: planificado. Depende de: 01-11 o alcance reducido aprobado explícitamente.

## Prompt de implementación para Codex

Validá las funcionalidades ecommerce implementadas como un sistema de punta a punta y prepará un handoff de release. Seguí `docs/plans/ecommerce/README.md`. No despliegues ni ejecutes migraciones de producción sin autorización separada.

### Pedido de funcionalidad

Creá fixtures seguros locales/staging que cubran un ítem simple, variantes 100 g/500 g, ítem de pieza única, ítem discontinuado, traducción faltante, costo privado BRL con precio de venta ARS, taxonomía inactiva, video, descuento programado, reseñas pendientes/aprobadas y asignación offline de stock.

Ejercitá creación en CMS a través de descubrimiento/detalle/carrito en storefront, pago sandbox, conciliación de orden, liberación de reserva, conteos de stock y ajustes offline. Inspeccioná cuerpos reales de respuestas públicas y relaciones pobladas para detectar filtraciones de campos privados. Probá acceso anónimo y rol incorrecto, no solo previews admin.

Auditá consistencia de moneda y dinero, preparación de traducciones, filtros compartibles, links de producto, accesibilidad, cachés desactualizadas, expiración de promociones, reintentos y compras concurrentes de último ítem. Confirmá que las asignaciones de evento protejan el stock web. Validá que cualquier job de invitación/ranking tenga realmente un mecanismo operativo de ejecución.

Prepará un plan ordenado de migración/backfill con prerrequisitos de backup, estrategia de rollback/forward-fix y una checklist para personal de catálogo/inventario. Actualizá documentación histórica contradictoria, incluida la localización por defecto y las descripciones del ciclo de checkout. Registrá resultados medidos de verificación y bloqueantes de lanzamiento restantes.

### Definición de terminado

- [ ] La evidencia de punta a punta cubre ambos locales, mobile/desktop, teclado, estados loading/vacío/error y resultados de pago sandbox.
- [ ] La matriz de seguridad prueba que datos privados de compras/clientes están ausentes de APIs públicas, archivos, logs y respuestas del storefront.
- [ ] Las pruebas de concurrencia/reintento prueban seguridad de pieza única y efectos de negocio exactamente una vez.
- [ ] El comportamiento existente de Shopify/proveedor y la compatibilidad de carritos persistidos tienen cobertura de regresión.
- [ ] Builds requeridos, lint, formato, migraciones sobre datos descartables y suites automatizadas corren exitosamente o quedan listados como bloqueantes.
- [ ] Los flujos operativos de publicación, ofertas, moderación de reseñas, ventas de evento, conteos de stock y recuperación de incidentes están documentados.
- [ ] Las funcionalidades diferidas están explícitamente no disponibles/deshabilitadas, sin controles ni afirmaciones engañosas.
- [ ] El usuario recibe un informe go/no-go; el despliegue a producción sigue requiriendo autorización separada.
