# Pago en efectivo con retiro local

El pago en efectivo es un medio manual y privado para pedidos con **retiro local**. No redirige a Mercado Pago y nunca se confirma desde el navegador del comprador.

## Plazo de retiro y cancelación

En Configuración de comercio, «Plazo para retirar y pagar (horas)» define el plazo de los pedidos nuevos: 48 horas por defecto, entre 1 y 720 horas enteras. El CMS guarda `paymentExpiresAt` al crear el pedido; los cambios posteriores de configuración no renuevan pedidos existentes. Los pedidos históricos sin fecha mantienen su comportamiento sin vencimiento.

El vencimiento se deriva de la fecha guardada, sin cron ni modificación del estado contable: el pago sigue sin recibirse, pero Mis pedidos muestra «Plazo vencido» y el contador excluye el pedido. La confirmación de efectivo rechaza pedidos vencidos dentro de la transacción de pago. Un pago ya confirmado sigue siendo válido, incluso después del plazo.

El comprador puede cancelar su pedido pendiente desde su detalle. La cancelación verifica la credencial de carrito y cancela pedido y venta local en una transacción, compartiendo los bloqueos de la confirmación. No borra registros, no modifica pagos aprobados o por verificar y no descuenta ni repone stock. Los pedidos cancelados o vencidos permiten «Intentar de nuevo» desde el carrito, con validación actual de catálogo, precio y disponibilidad.

La migración `20260918_180000_cash_pickup_window` agrega la configuración con valor por defecto, sin modificar pedidos históricos. El rollback elimina solamente la configuración; conserva los vencimientos guardados. Una versión anterior del código no aplica esta política: no retrocedas el código de cobro mientras existan pedidos con vencimiento sin un procedimiento de revisión manual.

### Prueba manual

1. Ejecutá la migración y configurá un plazo de una hora. Creá un pedido nuevo y verificá la fecha en español e inglés; recargá y comprobá que no se renueve.
2. Cancelalo desde su detalle. Verificá que desaparezca del contador y permanezca como cancelado en Mis pedidos; la caja debe rechazar el cobro.
3. Elegí «Intentar de nuevo»: debe crear otra referencia, con un plazo nuevo y validación de precio y disponibilidad.
4. Al vencer un pedido, verificá el estado vencido, la ausencia del botón de cobro y el rechazo desde la caja y el CMS. Las pruebas automatizadas simulan el vencimiento en una base descartable.
5. Confirmá un pedido vigente y verificá que no pueda cancelarse ni mostrarse vencido después. Comprobá también un pedido histórico sin fecha.

## Activación

1. En el CMS, abrí **Configuración → Configuración de comercio**.
2. Mantené habilitado **Retiro local**.
3. Activá **Efectivo**.

Si el cliente cambia a entrega, la tienda vuelve a Mercado Pago y el servidor rechaza cualquier intento de combinar entrega con efectivo.

## Recorrido del pedido

1. El comprador elige retiro local y efectivo, completa nombre y email, y confirma el pedido.
2. La tienda crea un pedido `pending` idempotente y una venta local vinculada; todavía no descuenta stock.
3. La pantalla pendiente muestra la referencia pública y el importe exacto. Solo el navegador que creó el pedido puede ver esos datos mediante su credencial de carrito guardada.
4. Al recibir el dinero, un administrador puede confirmar desde el CMS o el equipo puede usar [la caja del storefront](./staff-cash.md) con su contraseña compartida. En ambos casos se ingresa el importe en pesos ARS enteros (20000 se muestra como 20.000) y se confirma que se recibió y contó el efectivo.
5. En una transacción PostgreSQL, el CMS vuelve a validar catálogo, precio y stock, descuenta inventario una sola vez, marca pedido y venta local como pagados y guarda la auditoría privada.

La pantalla consulta el estado cada diez segundos mientras el pago está pendiente o por verificar y la pestaña está visible. También permite consultar manualmente. Un pedido aprobado nunca vuelve a pedir dinero; un pedido cancelado indica que no debe pagarse.

Al repetir un checkout sin cambios se reutiliza el pedido. Si cambian el resumen comercial o los datos del comprador, se crea otro intento y se cancelan el pedido de efectivo anterior y su venta local en la misma transacción. No se borra el historial ni se reemplaza un pago confirmado o por verificar. La creación y la confirmación comparten el bloqueo del carrito para evitar cobrar un intento reemplazado.

## Controles operativos

- El importe debe coincidir exactamente con el pedido en ARS.
- El endpoint administrativo exige un administrador. El acceso de caja usa su propio endpoint, una sesión limitada y la misma confirmación transaccional. Los clientes y las llamadas de otro origen no pueden confirmar.
- Reintentar una confirmación ya completada es seguro y no vuelve a descontar stock.
- Cambios de catálogo, falta de stock o un pago previo del mismo carrito detienen la confirmación para revisión.
- Confirmar el pago no equivale a marcar el pedido como entregado.

La migración `20260917_130000_cash_payment` agrega la configuración, el método de pago y la auditoría. Antes de desplegar, ejecutá las migraciones del CMS y verificá el flujo con un pedido de prueba.

El rollback se bloquea si existen pedidos, ventas o auditorías de efectivo: no convierte efectivo a Mercado Pago ni descarta evidencia. Con historial real, conservá el esquema y desplegá una corrección compatible. El rollback solo está disponible antes de registrar efectivo.

## Verificación

Seguí la [guía de prueba manual de efectivo](./cash-payment-manual-test.md) para comprobar el recorrido completo y sus límites.

- Ejecutá `node --import ./tests/register.mjs --test tests/cash-*.test.mjs tests/transfer-retry.test.mjs tests/transfer-waiting.test.mjs` desde la raíz.
- Desde `apps/cms`, ejecutá `node --import tsx scripts/test-transfer-confirmation.mjs`. Usa una base PostgreSQL local descartable y prueba confirmación concurrente, autorización, importe, stock, rollback parcial, competencia con transferencia, reemplazo y migración sin pérdida de auditoría.
- Manualmente, creá un pedido en efectivo, volvé al carrito y cambiá la cantidad. El checkout debe mostrar otra referencia; el anterior debe quedar cancelado y no poder cobrarse. Confirmá el nuevo desde el CMS: la pantalla debe mostrar el pago confirmado sin pedir otro pago. Repetí en español, inglés y móvil.

## Cierre del carrito

La aprobación persistida del pedido completa el carrito relacionado mediante `purchasedAt`, en la misma transacción que el pago y el inventario. No se elimina: conserva sus líneas, importes e historial y queda protegido contra modificaciones y borrado. El cierre es común a efectivo y transferencia (manual o conciliada automáticamente); no depende de parámetros de retorno del navegador.

El storefront trata un carrito comprado como vacío. Se sincroniza al ver la aprobación en la pantalla de espera, navegar, abrir el carrito o volver a la pestaña. La próxima compra crea otro carrito, sin borrar las credenciales del historial de «Mis pedidos». Consultar un pedido anterior no vacía un carrito nuevo. Una falla de red no descarta el carrito existente.

Se usa el campo nativo existente de Payload, sin migración de esquema. No se modifican retroactivamente pedidos aprobados antes del despliegue. Las referencias históricas sin carrito asociado no impiden confirmar un pago; solo se completa un carrito cuyo identificador y secreto coinciden. Pago confirmado no significa pedido retirado o entregado.
