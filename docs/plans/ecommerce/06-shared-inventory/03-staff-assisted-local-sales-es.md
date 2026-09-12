# Tarea 06.3: ventas locales asistidas por personal

> JIRA: PMG-362

## Alcance

Proveé un flujo privado en el CMS para ventas locales operadas por el personal
después de estabilizar el flujo de autogestión del webshop. Es independiente de
los registros de venta local del webshop de la Etapa 1 y no crea un segundo
checkout público.

## Requisitos funcionales

- Restringir la colección y todas sus mutaciones a personal y administradores autorizados.
- Soportar compradores invitados con información de contacto opcional.
- Usar los estados: `draft`, `pending_payment`, `paid`, `cancelled` y `conflict`.
- Rechazar transiciones inválidas, confirmaciones repetidas y edición de snapshots confirmados.
- Registrar actor, timestamp, referencia de idempotencia y motivo apto para auditoría en cada mutación.
- Soportar registro manual de pago `cash` con importe, moneda, hora, receptor y nota.
- Soportar registro manual de `mercado_pago_transfer` con referencia, importe, moneda,
  hora, nota del pagador y verificación explícita de la cuenta por personal autorizado.
- Nunca llamar a la autorización automática de Mercado Pago para transferencias manuales.
- Nunca tratar un redirect, imagen de comprobante o afirmación del cliente como verificación.
- Capturar snapshots inmutables de producto/variante, SKU, opciones, cantidad, precio, moneda y total.
- Las ventas en borrador y pendientes no reservan ni reducen stock.
- La confirmación revalida ciclo de vida, precio, moneda y disponibilidad, verifica la evidencia
  de pago y crea exactamente un movimiento idempotente en el ledger de forma atómica.
- Un conflicto de stock o precio deja la venta accionable; no puede confirmarse parcialmente.
- Soportar reembolsos, devoluciones, cancelación posterior al pago y movimientos de reversión
  controlados por administradores sin reescribir snapshots históricos.
- Requerir conexión activa con el CMS para guardar, verificar pagos y confirmar.

## Requisitos de límite

La Tarea 07 es responsable del pago, pedido, reserva, webhook y conciliación online
automáticos. La evidencia de pago manual permanece en este flujo privado y no
puede entrar al camino automatizado de webhooks. Los datos de proveedor y costo de
la Tarea 05 no forman parte del snapshot de venta ni de la evidencia de pago.

## Definición de terminado

- [ ] Los clientes no autorizados no pueden leer ni mutar registros de ventas locales del personal.
- [ ] Las transiciones y protecciones de campos inmutables se aplican en el servidor.
- [ ] La verificación de efectivo y transferencia manual de Mercado Pago tiene caminos auditados separados.
- [ ] La evidencia registra verificador, importe, moneda, referencia, hora y motivo cuando corresponde.
- [ ] Confirmar una venta crea un solo movimiento después de revalidar y verificar el pago correctamente.
- [ ] Los conflictos de precio, ciclo de vida, moneda y stock son recuperables y no sobre venden.
- [ ] Los pedidos repetidos y reintentos son idempotentes.
- [ ] Los permisos de reembolso, devolución, no-show, cancelación y reversión están documentados y probados.
- [ ] Los estados CMS de pendiente, guardado, éxito, falla y conflicto son usables en desktop/móvil.
- [ ] Se prueban permisos de personal, responsables, finanzas y administradores, incluidos intentos de bypass por API.
