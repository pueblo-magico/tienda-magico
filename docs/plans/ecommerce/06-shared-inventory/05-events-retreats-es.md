# Tarea 06.5: eventos y retiros

> JIRA: PMG-364

## Alcance

Agregá flujos operativos posteriores para stock de eventos y retiros después de
estabilizar el contrato de inventario compartido y los flujos de venta local. No
crees un segundo catálogo, POS, sistema de depósitos ni capa de sincronización
offline.

## Requisitos funcionales

- Asignar unidades vendibles a un evento o retiro mediante un flujo autorizado del CMS.
- Las unidades asignadas dejan de estar disponibles para compra online sin descontarse dos veces.
- Registrar ventas contra una asignación usando el mismo ledger de inventario y reglas de idempotencia.
- Liberar unidades asignadas no usadas y restaurar disponibilidad online de forma atómica.
- Impedir stock negativo y actualizaciones de asignación conflictivas.
- Advertir a operadores sobre eventos desconectados y registros manuales desactualizados.
- Conservar actor, canal, motivo, timestamps, versión de origen y referencias de idempotencia.
- Mantener privados asignaciones exactas, saldos, umbrales y notas del evento.
- Revalidar disponibilidad pública, carritos y checkout después de asignar, vender o liberar.
- Diferir las carreras de reservas online y la conciliación de pagos a la Tarea 07.

## Definición de terminado

- [ ] El personal autorizado puede crear, consultar, actualizar, vender contra y liberar asignaciones.
- [ ] La asignación deja no disponibles online los ítems afectados sin doble descuento.
- [ ] Las ventas contra asignación y las liberaciones preservan invariantes de inventario.
- [ ] Las solicitudes repetidas de asignación, venta y liberación son idempotentes.
- [ ] Las actualizaciones concurrentes producen conflictos recuperables y no pérdidas de escritura.
- [ ] Los registros de eventos desactualizados o desconectados son visibles y accionables para operadores.
- [ ] La disponibilidad pública y la recuperación de carritos desactualizados reflejan cambios de asignación.
- [ ] Los permisos impiden acceso de clientes y bypasses por API.
- [ ] Se registran controles EN/ES en desktop/móvil, teclado, privacidad, fallas y concurrencia.
