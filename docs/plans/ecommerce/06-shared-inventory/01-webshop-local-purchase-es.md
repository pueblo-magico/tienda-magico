# Tarea 06.1: compra local en el webshop

> JIRA: PMG-360

## Alcance

Permití que una persona use el webshop y el checkout de Mercado Pago existentes
mientras elige explícitamente retiro local o entrega online. No crees un segundo
catálogo, fuente de precios, carrito, flujo de pago, POS ni función de QR por
producto.

## Requisitos funcionales

- Descubrir productos mediante navegación normal, búsqueda, URLs directas o enlaces compartidos por el personal.
- Seleccionar el producto vendible o variante exactos antes de agregarlos al carrito.
- Exigir una elección localizada y accesible por teclado entre:
  - retiro local sin dirección ni etapa de envío;
  - entrega online con los requisitos de fulfillment existentes.
- Persistir la elección en carrito, cotización, checkout, retorno del pago y vistas del pedido.
- No inferir la elección desde URL, IP, Wi-Fi, ubicación ni analítica.
- Crear un registro privado de venta local vinculado al pedido ecommerce.
- Guardar snapshots comerciales inmutables: IDs de producto/variante, SKU, título localizado,
  opciones, cantidad, precio unitario, moneda y total.
- Mantener el estado de pago autoritativo; los redirects del navegador nunca son prueba de pago.
- Usar idempotencia para reintentos de checkout, callbacks, recargas y conciliación.
- Seguir la Tarea 07 para el momento de reserva y el ciclo de vida del pago.
- En el límite autoritativo acordado entre pago e inventario, crear exactamente un efecto
  en el inventario compartido sin contar dos veces las reservas.
- Mantener privados el stock exacto, las reservas, los umbrales, los locales y las notas operativas.

## Requisitos de límite

El registro de venta local no debe contener proveedor, SKU de proveedor, costo,
moneda del costo, base del costo, fechas de compra ni notas internas de la Tarea
05. La Tarea 07 es responsable de las transiciones de pedido online, pago,
reserva y pago tardío; este hito es responsable de la modalidad de retiro local
y su vínculo operativo local.

Los pagos pendientes, rechazados, cancelados, tardíos o no verificados deben
seguir siendo recuperables y no deben mostrarse como compras retiradas.

## Controles de aceptación

- Los recorridos de retiro local y entrega completan el checkout existente.
- El retiro local no solicita datos de entrega; la entrega sí.
- Los cambios de idioma y las recargas conservan modalidad e identidad del ítem.
- Las líneas afectadas por un carrito desactualizado son accionables y las no afectadas permanecen.
- Los callbacks duplicados no crean registros locales ni efectos de stock duplicados.
- Los errores de inventario o checkout fallan de forma cerrada con acciones localizadas de recuperación.

## Definición de terminado

- [ ] La persona compradora puede elegir y cambiar retiro local o entrega antes de finalizar.
- [ ] La modalidad elegida persiste en los datos de carrito, cotización, pedido y venta local.
- [ ] Cada pedido con retiro local tiene un único registro de venta local idempotente vinculado.
- [ ] El estado de pago proviene de la integración autoritativa de pagos.
- [ ] La conversión de reservas y la propiedad del efecto de stock están documentadas con la Tarea 07.
- [ ] Los reintentos, callbacks duplicados, pagos tardíos y stock insuficiente tienen resultados probados.
- [ ] No se requiere QR por producto ni mecanismo basado solo en Wi-Fi local.
- [ ] Las respuestas públicas no contienen inventario privado ni datos de compras de la Tarea 05.
- [ ] Se registran controles EN/ES en desktop, móvil, teclado, carrito desactualizado y estados de falla.
