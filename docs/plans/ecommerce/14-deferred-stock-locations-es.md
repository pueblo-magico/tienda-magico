# 14 — Diferido: ubicaciones físicas de stock y transferencias

Estado: diferido. Depende de: 06, 07. Ejecutar solo después de priorización explícita.

## Prompt de implementación para Codex

Después de aprobación explícita, evolucioná el modelo de inventario compartido para soportar ubicaciones físicas rastreadas de forma independiente sin duplicar stock. Seguí `docs/plans/ecommerce/README.md`.

### Pedido de funcionalidad

Agregá ubicaciones y saldos por ítem, distinguiendo ubicación de canal de venta. Un evento no es automáticamente un depósito. Migrá el pool compartido existente a una ubicación inicial, preservando todos los saldos, reservas e historial.

Agregá transferencias autorizadas de stock con estados despachada/recibida/cancelada y propiedad explícita en tránsito. Definí ubicaciones elegibles para online y orden de asignación antes de habilitar disponibilidad multi-ubicación. Resolvé asignaciones manuales de evento existentes durante la migración para que no se cuenten como stock reservado y físicamente transferido a la vez.

Mantené mutaciones atómicas/idempotentes y registros de auditoría. La disponibilidad agregada se deriva, no se edita por separado. No impliques que dispositivos POS/evento desconectados sincronizan automáticamente.

### Definición de terminado

- [ ] El stock compartido existente migra sin crear ni perder unidades.
- [ ] Las políticas de despacho, recepción, cancelación, pedidos duplicados y recepción parcial preservan cantidades.
- [ ] Solo stock elegible disponible contribuye al checkout online; las reservas identifican su origen.
- [ ] Ventas/transferencias concurrentes no pueden sobrevender ni asignar dos veces las mismas unidades.
- [ ] Las asignaciones de evento y transferencias de ubicación no pueden reservar dos veces el mismo inventario.
- [ ] Checks de permisos, protección de saldos privados, documentación operativa, recuperación de migración y verificación compartida están completos.

### Fuera de alcance

Integración POS, sincronización de conflictos offline, optimización de ruteo y venta multi-moneda.
