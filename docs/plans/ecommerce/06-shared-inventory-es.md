# 06 — Inventario compartido simple y ajustes por ventas offline

Estado: planificado. Depende de: 04, 05.

## Prompt de implementación para Codex

Implementá un único pool de inventario compartido para ventas online, de retiro y de eventos, con ajustes livianos y auditables. Seguí `docs/plans/ecommerce/README.md`.

### Pedido de funcionalidad

Proveé cantidad disponible física, cantidad reservada, cantidad disponible para venta, umbral privado de reposición y metadata de conteo de stock por ítem vendible. Definí disponible como stock físico menos reservas/asignaciones activas y stock de seguridad opcional; no debe haber un campo de disponibilidad editable de forma independiente. Reutilizá o proyectá transaccionalmente el campo de inventario del plugin mediante un dueño documentado, evitando que hooks descuenten stock dos veces.

Agregá ajustes de stock con ítem, cantidad con signo, motivo (recepción, venta offline, devolución, daño, corrección), canal (web, retiro, evento), actor, timestamp y referencia de idempotencia. Agregá una acción de staff para registrar rápidamente una venta offline. Registra movimiento de stock, no una transacción completa de contabilidad/pago.

El conteo físico captura cantidad contada, actor/fecha y el ajuste calculado, protegido contra escrituras concurrentes. Proveé asignación/liberación manual para eventos: las unidades asignadas no están disponibles online hasta que se vendan o liberen, sin restar dos veces las mismas unidades. Advertí a los operadores sobre eventos desconectados y registros manuales desactualizados.

Usá actualizaciones atómicas, autorización y validación. Impedí stock negativo salvo que una política explícitamente aprobada lo permita. Los saldos exactos privados y umbrales de reposición nunca fluyen al catálogo público. Proveé un registro privado mínimo de ajustes de conversión manual para soporte futuro de granel; no implementes un motor de empaquetado en esta tarea.

### UI requerida de CMS y representación en el storefront

- Flujo de inventario de ítem en CMS: el personal autorizado puede inspeccionar cantidades privadas físicas/reservadas/asignadas/disponibles, registrar recepciones/ventas offline/devoluciones/daños/correcciones, conciliar un conteo físico y asignar/liberar stock de evento. Mostrá historial de ajustes, actor/canal/motivo, validación, estados pendiente/guardado/falla y conflictos de concurrencia con una ruta segura de refresh/reintento. Dejá claro que un ajuste de stock offline no es un registro de pago/contabilidad.
- Cards/listados de producto, productos destacados CMS y cards existentes de productos relacionados: reflejan disponibilidad pública desde el mismo pool compartido. El detalle de producto y los selectores de variantes muestran estados localizado disponible/no disponible y deshabilitan compra para variantes agotadas. Nunca infieras disponibilidad minorista desde stock de proveedor o granel.
- Controles de cantidad en detalle de producto, drawer de carrito y página de carrito consumen un límite seguro de compra documentado sin exponer saldos exactos, totales de reserva/asignación ni umbrales de reposición. Definí ese límite como un tope público de política de compra y no como una lectura exacta de stock; omitilo si no puede cumplir el contrato de privacidad y manejá el rechazo del servidor de forma accesible. La validación del servidor sigue siendo autoritativa.
- Carritos existentes: después de que una venta offline o asignación reduzca disponibilidad, revalidá al cargar carrito, cambiar cantidades y entrar al checkout existente. Mostrá qué línea necesita atención con acciones localizadas de ajuste de cantidad/remoción, conservá las líneas no afectadas e impedí avanzar con cantidades inválidas conocidas. No elimines ítems silenciosamente ni impliques que el contenido del carrito reserva stock.
- La UI de checkout existente debe mostrar rechazos de inventario con un regreso accionable a la línea de carrito afectada. La tarea 07 todavía se ocupa de reservas atómicas de checkout, expiración y conciliación de pagos; esta tarea debe entregar feedback de stock y checks de servidor del storefront actual sin afirmar que la concurrencia de checkout por última unidad está resuelta.
- Definí e implementá invalidación/revalidación de caché para cada mutación de inventario, para que superficies abiertas o revisadas del storefront se reconcilien bajo una política de frescura documentada. Ante falla del servicio de inventario, mostrá un estado recuperable e impedí compras no verificadas en vez de asumir que hay stock. Reutilizá controles compartidos y actualizá `/ui-system` cuando cambien estados compartidos de disponibilidad/error.

### Flujo de aceptación humana

Empezá con un fixture local de stock conocido y abrí el detalle de producto y un carrito que contenga ese ítem. Registrá una venta de retiro desde CMS; verificá disponibilidad en listado/detalle y feedback de carrito desactualizado después del trigger documentado de refresh/revalidación. Asigná el stock restante a un evento y verificá que la compra online quede no disponible; registrá una venta contra la asignación, luego liberá unidades sin usar y verificá que la disponibilidad online vuelva correctamente. Ejercitá recepción, devolución, daño y corrección por conteo desde la UI. Repetí un pedido de ajuste, enviá actualizaciones en competencia y simulá una falla de lectura/escritura de stock para verificar que no haya doble deducción, actualizaciones perdidas, éxito engañoso ni compra no verificada. Ejecutá controles EN/ES desktop/mobile y de teclado, e inspeccioná payloads públicos en busca de cantidades privadas. Registrá resultados en una checklist manual junto a esta tarea.

### Definición de terminado

- [ ] Una venta de retiro/evento reduce disponibilidad del mismo pool usado por el ecommerce web.
- [ ] Los pedidos de ajuste repetidos no descuentan dos veces; los ajustes simultáneos no pierden actualizaciones.
- [ ] Se prueba el comportamiento de conciliación de conteo, daño, devolución, recepción y umbral de bajo stock.
- [ ] La asignación de evento, venta contra asignación y liberación de asignación no usada preservan invariantes de stock.
- [ ] El personal no puede sobrescribir cantidades calculadas ni saltear permisos usando APIs.
- [ ] La migración desde el inventario actual del plugin preserva el stock existente y documenta la conciliación.
- [ ] Los operadores tienen un flujo práctico de ajuste/conteo y limitaciones claras.
- [ ] Las pantallas CMS de ajuste/asignación/conteo son usables de punta a punta, incluidas fallas de guardado y recuperación de edición concurrente.
- [ ] Una mutación de inventario en CMS llega a cards/listados, controles de detalle/variante, drawer/página de carrito y feedback de checkout existente mediante la política de frescura documentada.
- [ ] Stock agotado, carritos desactualizados, límites de pieza única y servicios de inventario no disponibles producen UI localizada y accionable sin exponer saldos exactos ni afirmar una reserva.
- [ ] El flujo de aceptación humana tiene registrados resultados EN/ES desktop/mobile, teclado, privacidad y casos de falla; las APIs de inventario por sí solas no completan la funcionalidad.
- [ ] La verificación compartida pasa; la integración de reservas de checkout sigue siendo tarea 07, no se declara completa acá.

### Fuera de alcance

Depósitos separados, integración POS, ledger de compras, conversión automática de granel y sincronización offline.
