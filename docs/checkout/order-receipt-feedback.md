# Confirmación de recepción y experiencia de compra

Después de que el pago queda aprobado, el comprador puede confirmar que recibió los productos desde la pantalla del pedido o desde «Mis pedidos». La confirmación acepta una puntuación entera de 0 a 5 y un comentario opcional de hasta 1000 caracteres.

«Ahora no» solamente oculta el formulario durante la vista actual: no marca el pedido como recibido y permite volver más tarde. Una confirmación guardada es inmutable e idempotente; recargar o repetir la solicitud no reemplaza la reseña.

## Seguridad y datos

El resumen del pedido en efectivo muestra cantidades e importes del snapshot comercial histórico. Las imágenes provienen del producto relacionado y pueden cambiar; si ya no está disponible, se muestra un ícono. La referencia abreviada es solo visual: copiar mantiene el UUID completo. Los detalles se incluyen únicamente en la consulta de pedidos del comprador autenticada por su credencial de carrito. No se infiere envío gratuito ni se muestra «Total pagado» antes de aprobar el pago.

- El storefront solo acepta la solicitud desde el mismo origen.
- La referencia pública no alcanza para autorizar: el pedido debe pertenecer a una credencial de carrito guardada en la cookie `HttpOnly` del navegador.
- El pedido debe tener el pago aprobado y no puede estar confirmado previamente.
- La API pública no expone la credencial del carrito ni los datos del comprador.

## Migración

La migración `20260917_150000_order_receipt_feedback` agrega `receivedAt`, `experienceRating` y `experienceComment` como campos opcionales. No requiere backfill y no cambia pedidos históricos.

El rollback se bloquea cuando existe una confirmación o reseña para evitar pérdida de datos. Antes de revertir en un entorno sin datos, comprobá que los tres campos estén vacíos.

## Prueba manual

1. Aplicá las migraciones del CMS y abrí la tienda en español.
2. Creá y pagá un pedido, luego actualizá su estado hasta que figure aprobado.
3. En «Mis pedidos», verificá que aparezca el formulario de recepción solamente en el pedido aprobado.
4. Elegí 0 y confirmá sin comentario; verificá que el pedido quede recibido y que el formulario desaparezca.
5. Repetí con otro pedido, elegí entre 1 y 5 estrellas y escribí un comentario.
6. En un tercer pedido, presioná «Ahora no», recargá la página y comprobá que el formulario vuelva a estar disponible.
7. Intentá enviar la referencia desde otro navegador sin su cookie: la API debe responder que el pedido no fue encontrado.
8. Repetí en inglés, móvil y con navegación por teclado.
