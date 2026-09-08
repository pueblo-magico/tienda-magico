# 07 — Reliable orders, payments, and checkout stock protection

Status: planned. Depends on: 04, 06. Launch blocker.

## Codex implementation prompt

Complete the transaction lifecycle linking existing Payload carts/orders, Mercado Pago checkout, and shared inventory. Follow `docs/plans/ecommerce/README.md` and inspect the current checkout implementation rather than trusting historical documentation.

### Feature request

Create authoritative server-side checkout quotes from current catalog and stock. Persist immutable order-line snapshots: product/variant references, SKU, localized title and selected options, quantity, ARS unit/line amounts, and explicit shipping/tax/discount amounts where applicable. Preserve originals on later product edits; cancellation/refund events must not rewrite history.

Implement documented separate order/payment/fulfillment states, with allowed transitions. Use provider-neutral order identifiers; never expose guest cart secrets through gateway external references, URLs, logs, or order identifiers. Keep existing guest-cart authorization intact and audit secret propagation.

Atomically reserve stock at the defined checkout milestone, with expiry/release, payment failure/cancel handling, and success conversion to sold stock exactly once. Resolve reservation duration and late asynchronous payment policy explicitly: an expired reservation followed by payment must enter safe revalidation/refund/manual resolution, never silently oversell. Adding an item to a casual cart must not reserve indefinitely.

Verify webhook authenticity before side effects, retrieve payment authoritatively, validate amount/currency/order association, and process duplicate/out-of-order notifications idempotently. Browser success redirects are not payment proof. Provide reconciliation for interrupted processing. Confirm plugin hooks and application logic do not both decrement inventory or create duplicate orders.

### Representación requerida en el storefront y el CMS

- Inicio de checkout: el carrito y cualquier acceso directo al checkout deben solicitar una cotización autoritativa al servidor antes de redirigir al proveedor de pago. Mientras se valida, deben mostrar un estado pendiente accesible, impedir envíos duplicados y conservar el carrito si la operación falla.
- Errores previos al pago: precio modificado, variante discontinuada, cantidad insuficiente, reserva vencida, moneda incorrecta o carrito desactualizado deben identificar las líneas afectadas con mensajes localizados y acciones para ajustar cantidad, quitar el ítem o volver al producto. Los ítems válidos deben conservarse; no se deben reemplazar variantes ni aceptar importes del cliente silenciosamente.
- Resultado de pago: las rutas de retorno de Mercado Pago deben mostrar estados localizados separados para pendiente, aprobado, rechazado/cancelado y resultado todavía no verificado. La redirección del navegador nunca debe presentar una compra como confirmada antes de la verificación autoritativa. Los reintentos y recargas deben ser seguros y no crear otra orden, cobro ni deducción.
- Confirmación y consulta de orden: clientes autenticados y compradores invitados deben poder consultar únicamente sus propias órdenes mediante el mecanismo de acceso seguro acordado. La vista debe usar el snapshot inmutable para mostrar productos/opciones, cantidades, importes ARS y estados de pago/entrega, aun si luego cambia el catálogo. No debe exponer secretos del carrito, referencias internas del gateway ni datos operativos.
- Recuperación: si el pago queda pendiente, el webhook se demora o la reconciliación falla, el storefront debe explicar que no se repita el pago a ciegas, permitir una consulta segura del estado y ofrecer un próximo paso accionable. Los estados desconocidos deben fallar de forma segura sin afirmar éxito ni liberar stock prematuramente.
- Operación en CMS: el personal autorizado debe poder inspeccionar la orden, los estados separados, la reserva y la evidencia de conciliación; reintentar una conciliación idempotente; y resolver casos manuales documentados sin editar snapshots históricos ni forzar transiciones inválidas. Las acciones destructivas o financieras requieren confirmación, permisos y auditoría.
- Integración con inventario mixto: una venta o asignación presencial registrada por la tarea 06 debe poder invalidar la cotización online antes del pago. Una reserva online activa debe reducir la disponibilidad compartida para las operaciones locales según la política definida. Todas las superficies deben reconciliarse mediante una política documentada de frescura/invalidez.
- Reutilizar los componentes, tokens y patrones existentes. Cualquier texto visible debe existir en EN/ES mediante `next-intl`; los cambios a estados compartidos deben reflejarse en `/ui-system`. Verificar teclado, foco, lectores de pantalla y comportamiento responsive para cada estado del checkout.

### Flujo de aceptación humana

Con fixtures locales y Mercado Pago sandbox, iniciar dos checkouts simultáneos por la última unidad y verificar que solo uno obtenga una reserva válida. Antes del pago, cambiar el precio y registrar una venta presencial que agote otro ítem; comprobar que el storefront conserva el carrito, señala cada línea afectada y ofrece correcciones localizadas. Completar un pago aprobado y recorrer también estados pendiente, rechazado, cancelado, reserva vencida y pago tardío. Recargar y repetir callbacks/webhooks para confirmar que la orden, el cobro y el movimiento de stock ocurren exactamente una vez. Luego editar nombre, precio y variante en CMS y comprobar que la confirmación conserva el snapshot original. Repetir en EN/ES, desktop/mobile y con teclado, incluyendo comprador invitado, cliente autenticado, usuario ajeno, error de red y reconciliación demorada. Registrar evidencia en una checklist manual junto a esta tarea.

### Definition of done

- [ ] Two customers racing for the final unit produce at most one valid stock allocation; one-of-a-kind quantity is enforced server-side.
- [ ] Changed price, insufficient stock, wrong currency, and stale cart are handled before payment with localized actionable feedback.
- [ ] Successful payment creates/updates one order and one stock effect, including webhook retries and reconciliation.
- [ ] Forged, mismatched, duplicate, delayed, and out-of-order events are tested in sandbox/local fixtures.
- [ ] Expiry, cancellation, failure, and late success preserve inventory and financial state consistency.
- [ ] Order snapshots survive later name/price/variant edits; customer ownership protects all order reads.
- [ ] Guest secrets and payment internals do not leak into logs, responses, or provider metadata.
- [ ] El flujo carrito → cotización → proveedor de pago → retorno → confirmación funciona de punta a punta en el storefront; implementar solo endpoints, webhooks o estados de base de datos no completa la funcionalidad.
- [ ] Los estados pendiente, aprobado, rechazado/cancelado, vencido, tardío, no verificado y error de reconciliación tienen representación localizada, accesible y accionable sin afirmar resultados no verificados.
- [ ] Las vistas de orden para clientes e invitados usan snapshots históricos y aplican autorización por propietario; usuarios ajenos y enlaces manipulados no obtienen datos.
- [ ] Las ventas/asignaciones presenciales y las reservas online compiten contra el mismo stock sin ventanas conocidas de sobreventa, y la UI refleja los conflictos de forma recuperable.
- [ ] El CMS ofrece un flujo operativo autorizado para inspección y conciliación idempotente, con auditoría y recuperación de errores; no depende de cambios directos en base de datos.
- [ ] El flujo de aceptación registra resultados EN/ES, desktop/mobile, teclado, reintentos, recargas, fallas de red y carreras por la última unidad. Las pruebas aisladas de webhook no sustituyen esta verificación.
- [ ] Recovery procedures, migration, tests, and actual sandbox verification are documented; unavailable gateway verification is a launch blocker, not a pass.

### Out of scope

New payment providers, automated accounting, multi-currency settlement, and full warehouse fulfillment tooling.
