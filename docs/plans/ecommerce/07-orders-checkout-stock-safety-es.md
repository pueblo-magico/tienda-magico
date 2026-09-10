# 07 — Órdenes confiables, pagos y protección de stock en checkout

Estado: planificado. Depende de: 04, 06. Bloqueante de lanzamiento.

## Prompt de implementación para Codex

Completá el ciclo de transacción que vincula carritos/órdenes existentes de Payload, checkout de Mercado Pago e inventario compartido. Seguí `docs/plans/ecommerce/README.md` e inspeccioná la implementación actual de checkout en vez de confiar en documentación histórica.

### Pedido de funcionalidad

Creá cotizaciones autoritativas del lado servidor a partir del catálogo y stock actuales. Persistí snapshots inmutables de líneas de orden: referencias de producto/variante, SKU, título localizado y opciones seleccionadas, cantidad, importes unitarios/de línea en ARS e importes explícitos de envío/impuestos/descuentos donde aplique. Preservá los originales ante ediciones posteriores del producto; eventos de cancelación/reembolso no deben reescribir la historia.

Implementá estados separados y documentados de orden/pago/preparación, con transiciones permitidas. Usá identificadores de orden neutrales al proveedor; nunca expongas secretos de carrito invitado mediante referencias externas del gateway, URLs, logs o identificadores de orden. Mantené intacta la autorización existente de carrito invitado y auditá la propagación de secretos.

Reservá stock atómicamente en el hito de checkout definido, con expiración/liberación, manejo de falla/cancelación de pago y conversión a stock vendido exactamente una vez ante éxito. Resolvé explícitamente duración de reserva y política de pago asincrónico tardío: una reserva vencida seguida por pago debe entrar en revalidación segura/reembolso/resolución manual, nunca sobrevender silenciosamente. Agregar un ítem a un carrito casual no debe reservarlo indefinidamente.

Verificá autenticidad de webhooks antes de efectos secundarios, recuperá el pago de forma autoritativa, validá importe/moneda/asociación de orden y procesá notificaciones duplicadas o fuera de orden de forma idempotente. Los redirects de éxito del navegador no son prueba de pago. Proveé conciliación para procesamiento interrumpido. Confirmá que hooks del plugin y lógica de aplicación no descuenten inventario dos veces ni creen órdenes duplicadas.

### Representación requerida en el storefront y el CMS

- Inicio de checkout: el carrito y cualquier acceso directo al checkout deben solicitar una cotización autoritativa al servidor antes de redirigir al proveedor de pago. Mientras se valida, deben mostrar un estado pendiente accesible, impedir envíos duplicados y conservar el carrito si la operación falla.
- Errores previos al pago: precio modificado, variante discontinuada, cantidad insuficiente, reserva vencida, moneda incorrecta o carrito desactualizado deben identificar las líneas afectadas con mensajes localizados y acciones para ajustar cantidad, quitar el ítem o volver al producto. Los ítems válidos deben conservarse; no se deben reemplazar variantes ni aceptar importes del cliente silenciosamente.
- Resultado de pago: las rutas de retorno de Mercado Pago deben mostrar estados localizados separados para pendiente, aprobado, rechazado/cancelado y resultado todavía no verificado. La redirección del navegador nunca debe presentar una compra como confirmada antes de la verificación autoritativa. Los reintentos y recargas deben ser seguros y no crear otra orden, cobro ni deducción.
- Confirmación y consulta de orden: clientes autenticados y compradores invitados deben poder consultar únicamente sus propias órdenes mediante el mecanismo de acceso seguro acordado. La vista debe usar el snapshot inmutable para mostrar productos/opciones, cantidades, importes ARS y estados de pago/entrega, aun si luego cambia el catálogo. No debe exponer secretos del carrito, referencias internas del gateway ni datos operativos.
- Recuperación: si el pago queda pendiente, el webhook se demora o la conciliación falla, el storefront debe explicar que no se repita el pago a ciegas, permitir una consulta segura del estado y ofrecer un próximo paso accionable. Los estados desconocidos deben fallar de forma segura sin afirmar éxito ni liberar stock prematuramente.
- Operación en CMS: el personal autorizado debe poder inspeccionar la orden, los estados separados, la reserva y la evidencia de conciliación; reintentar una conciliación idempotente; y resolver casos manuales documentados sin editar snapshots históricos ni forzar transiciones inválidas. Las acciones destructivas o financieras requieren confirmación, permisos y auditoría.
- Integración con inventario mixto: una venta o asignación presencial registrada por la tarea 06 debe poder invalidar la cotización online antes del pago. Una reserva online activa debe reducir la disponibilidad compartida para las operaciones locales según la política definida. Todas las superficies deben reconciliarse mediante una política documentada de frescura/invalidez.
- Reutilizá los componentes, tokens y patrones existentes. Cualquier texto visible debe existir en EN/ES mediante `next-intl`; los cambios a estados compartidos deben reflejarse en `/ui-system`. Verificá teclado, foco, lectores de pantalla y comportamiento responsive para cada estado del checkout.

### Flujo de aceptación humana

Con fixtures locales y Mercado Pago sandbox, iniciá dos checkouts simultáneos por la última unidad y verificá que solo uno obtenga una reserva válida. Antes del pago, cambiá el precio y registrá una venta presencial que agote otro ítem; comprobá que el storefront conserva el carrito, señala cada línea afectada y ofrece correcciones localizadas. Completá un pago aprobado y recorré también estados pendiente, rechazado, cancelado, reserva vencida y pago tardío. Recargá y repetí callbacks/webhooks para confirmar que la orden, el cobro y el movimiento de stock ocurren exactamente una vez. Luego editá nombre, precio y variante en CMS y comprobá que la confirmación conserva el snapshot original. Repetí en EN/ES, desktop/mobile y con teclado, incluyendo comprador invitado, cliente autenticado, usuario ajeno, error de red y conciliación demorada. Registrá evidencia en una checklist manual junto a esta tarea.

### Definición de terminado

- [ ] Dos clientes compitiendo por la última unidad producen como máximo una asignación válida de stock; la cantidad de pieza única se aplica en servidor.
- [ ] Precio modificado, stock insuficiente, moneda incorrecta y carrito desactualizado se manejan antes del pago con feedback localizado y accionable.
- [ ] Un pago exitoso crea/actualiza una orden y un efecto de stock, incluidos reintentos de webhook y conciliación.
- [ ] Se prueban eventos falsificados, no coincidentes, duplicados, demorados y fuera de orden con fixtures sandbox/locales.
- [ ] Expiración, cancelación, falla y éxito tardío preservan la consistencia de inventario y estado financiero.
- [ ] Los snapshots de orden sobreviven ediciones posteriores de nombre/precio/variante; la propiedad del cliente protege todas las lecturas de orden.
- [ ] Secretos de invitado e internos de pago no se filtran en logs, respuestas ni metadata del proveedor.
- [ ] El flujo carrito → cotización → proveedor de pago → retorno → confirmación funciona de punta a punta en el storefront; implementar solo endpoints, webhooks o estados de base de datos no completa la funcionalidad.
- [ ] Los estados pendiente, aprobado, rechazado/cancelado, vencido, tardío, no verificado y error de conciliación tienen representación localizada, accesible y accionable sin afirmar resultados no verificados.
- [ ] Las vistas de orden para clientes e invitados usan snapshots históricos y aplican autorización por propietario; usuarios ajenos y enlaces manipulados no obtienen datos.
- [ ] Las ventas/asignaciones presenciales y las reservas online compiten contra el mismo stock sin ventanas conocidas de sobreventa, y la UI refleja los conflictos de forma recuperable.
- [ ] El CMS ofrece un flujo operativo autorizado para inspección y conciliación idempotente, con auditoría y recuperación de errores; no depende de cambios directos en base de datos.
- [ ] El flujo de aceptación registra resultados EN/ES, desktop/mobile, teclado, reintentos, recargas, fallas de red y carreras por la última unidad. Las pruebas aisladas de webhook no sustituyen esta verificación.
- [ ] Los procedimientos de recuperación, migración, pruebas y verificación real en sandbox están documentados; una verificación de gateway no disponible es bloqueante de lanzamiento, no un aprobado.

### Fuera de alcance

Nuevos proveedores de pago, contabilidad automatizada, liquidación multi-moneda y tooling completo de preparación en depósito.
