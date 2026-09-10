# 11 — Novedad, overrides de más vendidos y ranking confiable de ventas

Estado: planificado. Depende de: 03, 07.

## Prompt de implementación para Codex

Implementá badges de merchandising coherentes sin booleanos independientes en conflicto. Seguí `docs/plans/ecommerce/README.md`.

### Pedido de funcionalidad

Proveé modos de novedad y más vendido: automático, forzar activo, forzar inactivo. Usá momento de primera publicación, no creación de borrador ni última actualización, para la novedad automática. Mantené la primera publicación estable a través de ediciones/despublicar/republicar; documentá la migración para productos históricos con fechas de publicación desconocidas.

La ventana de novedad, ventana de ranking de más vendidos, umbral mínimo de ventas y corte de ranking son configuraciones de negocio. Proponé y documentá valores iniciales antes de habilitar comportamiento automático. El ranking de más vendidos usa unidades netas pagadas con manejo explícito de cancelaciones, devoluciones, reembolsos, empates, agregación de variantes y canales elegibles. Los ajustes de stock offline por sí solos no son ventas pagas verificadas; excluilos salvo que estén respaldados por registros de venta calificantes.

Recalculá mediante un job/ruta de invalidación documentada con timestamp de cálculo y comportamiento ante fallas. Los modos manuales ganan sobre los resultados automáticos. No presentes productos sin datos como más vendidos. Si las ventas conciliadas confiables no están disponibles, mantené el automático de más vendido apagado y explicá por qué en CMS. Usá el mismo estado derivado para badges, selecciones destacadas y ordenamiento por más vendidos.

### Definición de terminado

- [ ] Editores pueden forzar activo/inactivo o volver al modo automático intencionalmente.
- [ ] La novedad no se reinicia por actualizaciones de contenido ni republicación.
- [ ] Las pruebas cubren ventas pagas/no pagas/canceladas/reembolsadas, empates, límites de ventana, datos insuficientes y overrides manuales.
- [ ] El ranking automático tiene un único cálculo autoritativo y política documentada de refresh/desactualización.
- [ ] Badges y ordenamiento coinciden en listado/detalle en EN/ES; los totales privados de ventas no se exponen públicamente.
- [ ] Backfill histórico, operación de job, guía para editores y checks compartidos están completos.

### Fuera de alcance

Forecasting, dashboards de analytics de ingresos, servicios externos de analytics e ingresos offline inferidos.
