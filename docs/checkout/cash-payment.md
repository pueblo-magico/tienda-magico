# Pago en efectivo con retiro local

El pago en efectivo es un medio manual y privado para pedidos con **retiro local**. No redirige a Mercado Pago, no vence automáticamente y nunca se confirma desde el navegador del comprador.

## Activación

1. En el CMS, abrí **Configuración → Configuración de comercio**.
2. Mantené habilitado **Retiro local**.
3. Activá **Efectivo**.

Si el cliente cambia a entrega, la tienda vuelve a Mercado Pago y el servidor rechaza cualquier intento de combinar entrega con efectivo.

## Recorrido del pedido

1. El comprador elige retiro local y efectivo, completa nombre y email, y confirma el pedido.
2. La tienda crea un pedido `pending` idempotente y una venta local vinculada; todavía no descuenta stock.
3. La pantalla pendiente muestra la referencia pública y el importe exacto. Solo el navegador que creó el pedido puede ver esos datos mediante su credencial de carrito guardada.
4. Al recibir el dinero, un administrador abre el pedido en el CMS, ingresa el importe en centavos ARS, confirma que contó el efectivo y ejecuta **Confirmar efectivo**.
5. En una transacción PostgreSQL, el CMS vuelve a validar catálogo, precio y stock, descuenta inventario una sola vez, marca pedido y venta local como pagados y guarda la auditoría privada.

La pantalla consulta el estado cada diez segundos mientras el pago está pendiente o por verificar y la pestaña está visible. También permite consultar manualmente. Un pedido aprobado nunca vuelve a pedir dinero; un pedido cancelado indica que no debe pagarse.

Al repetir un checkout sin cambios se reutiliza el pedido. Si cambian el resumen comercial o los datos del comprador, se crea otro intento y se cancelan el pedido de efectivo anterior y su venta local en la misma transacción. No se borra el historial ni se reemplaza un pago confirmado o por verificar. La creación y la confirmación comparten el bloqueo del carrito para evitar cobrar un intento reemplazado.

## Controles operativos

- El importe debe coincidir exactamente con el pedido en ARS.
- Solo administradores pueden confirmar; clientes, staff y llamadas de otro origen son rechazados.
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

## Decisión pendiente: cierre del carrito

La aprobación del pago todavía no completa ni rota el carrito activo. Definir ese cierre como un paso común a todos los medios de pago, conservando el pedido y el acceso de «Mis pedidos». No confundir pago confirmado con pedido retirado o entregado.
