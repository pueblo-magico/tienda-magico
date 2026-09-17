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

## Controles operativos

- El importe debe coincidir exactamente con el pedido en ARS.
- Solo administradores pueden confirmar; clientes, staff y llamadas de otro origen son rechazados.
- Reintentar una confirmación ya completada es seguro y no vuelve a descontar stock.
- Cambios de catálogo, falta de stock o un pago previo del mismo carrito detienen la confirmación para revisión.
- Confirmar el pago no equivale a marcar el pedido como entregado.

La migración `20260917_130000_cash_payment` agrega la configuración, el método de pago y la auditoría. Antes de desplegar, ejecutá las migraciones del CMS y verificá el flujo con un pedido de prueba.
