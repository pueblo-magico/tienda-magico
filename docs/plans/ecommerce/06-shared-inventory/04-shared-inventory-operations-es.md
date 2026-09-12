# Tarea 06.4: operaciones de inventario compartido

> JIRA: PMG-363

## Alcance

Implementá un único pool de inventario autoritativo para compras online, pedidos
locales de la Etapa 1, ventas asistidas por personal, ventas de retiro y
operaciones de eventos.

## Contrato de inventario

Para cada ítem vendible, proveé metadata privada de cantidad física, reserva
activa, asignación activa, umbral de reposición y conteo de stock. Calculá la
cantidad disponible como cantidad física menos reservas activas, asignaciones y
stock de seguridad documentado. Exponé solo disponibilidad pública localizada
y, si la privacidad lo permite, un tope de compra de política en vez de stock
exacto. La proyección del `inventory` del plugin tiene un único dueño
documentado y no existe un campo de disponibilidad editable de forma
independiente.

## Ledger y mutaciones

Registrá ítem vendible, cantidad con signo, motivo, canal, actor, timestamp y
referencia de idempotencia para recepciones, ventas del webshop, ventas locales
del webshop, ventas asistidas/offline, devoluciones, daños, correcciones y
conciliación de conteos físicos. Usá actualizaciones atómicas, autorización,
validación, protección contra stock negativo e idempotencia. Las solicitudes en
competencia no pueden perder actualizaciones ni descontar dos veces.

Los conteos físicos registran cantidad contada, actor, fecha, saldo/versión de
origen y ajuste calculado. Los cambios concurrentes producen un conflicto
recuperable. Se pueden registrar ajustes de conversión manual para soporte
futuro de granel; no se incluye un motor de empaquetado.

## Comportamiento del CMS y storefront

Los operadores autorizados pueden inspeccionar saldos/historial privados y
registrar recepciones, ventas, devoluciones, daños, correcciones y conteos. La
UI muestra actor, canal, motivo, timestamps, validación, estados de guardado o
falla y conflictos de concurrencia. Los permisos impiden bypasses por API y
distinguen ajustes de inventario de registros de pago/contabilidad.

Cards, listados, productos destacados, cards relacionadas, detalles y selectores
usan disponibilidad pública. Después de una mutación de inventario, revalidá la
carga del carrito, cambios de cantidad, entrada al checkout y superficies de
catálogo afectadas. Conservá las líneas no afectadas, ofrecé acciones localizadas
de ajuste/remoción y fallá de forma cerrada cuando no pueda verificarse la
disponibilidad.

La Tarea 07 es responsable de reservas del checkout online, expiración, webhooks
de pago, conciliación y carreras por la última unidad. Este hito provee el
contrato de inventario compartido y el feedback público de stock sin convertir
los carritos casuales en reservas.

## Migración y privacidad

Migrá los saldos actuales de productos y variantes sin cambiar IDs vendibles ni
referencias de carritos. Documentá conciliación, saldos conflictivos, rollback e
idempotencia. Excluí proveedor, SKU de proveedor, costo, moneda del costo, base
del costo, fechas y notas internas de la Tarea 05 de las superficies públicas,
de clientes, pedidos, inventario, exportaciones, logs y cachés.

## Definición de terminado

- [ ] Se documentan y aplican un único dueño y una única proyección de inventario.
- [ ] Se prueban cantidad disponible, reservas/asignaciones, stock de seguridad, umbrales y topes de compra.
- [ ] Las mutaciones del ledger son atómicas, idempotentes, autorizadas y rechazan stock negativo.
- [ ] Recepciones, ventas, devoluciones, daños, correcciones y conteos físicos funcionan de punta a punta.
- [ ] Los conflictos concurrentes de conteo y mutación tienen actualización/reintento seguro.
- [ ] Se rechazan sobrescrituras directas de inventario y bypasses de permisos por API.
- [ ] Listados, detalle, selectores, carritos y checkout reflejan cambios de inventario bajo una política de frescura documentada.
- [ ] Los carritos desactualizados conservan líneas no afectadas y ofrecen recuperación localizada accionable.
- [ ] Las fallas del servicio de inventario fallan de forma cerrada sin afirmar disponibilidad.
- [ ] La migración conserva IDs/referencias de carritos y tiene evidencia de rollback/conciliación.
- [ ] Los payloads públicos y de clientes excluyen saldos exactos, umbrales, notas operativas y datos de compras de la Tarea 05.
- [ ] Se registran controles EN/ES responsive, de teclado, privacidad, fallas y concurrencia.
