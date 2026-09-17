# Prueba manual de pago en efectivo

Usá únicamente desarrollo local o un entorno de prueba. No hace falta entregar dinero real ni llamar a Mercado Pago. Las confirmaciones modifican pedidos e inventario: usá productos y compradores de prueba.

## Preparación

1. Iniciá CMS y storefront. Verificá que esté aplicada la migración `20260917_130000_cash_payment`; no ejecutes un rollback ni aceptes pérdida de datos para preparar esta prueba.
2. Ingresá al CMS como administrador. En Configuración de comercio, habilitá **Retiro local** y **Efectivo**.
3. Usá un producto publicado, con SKU, precio en ARS y al menos cinco unidades. Anotá su stock inicial.
4. Abrí una sesión de navegador de prueba nueva para no reutilizar un carrito que ya tenga un pago aprobado. Mantené esa sesión para acceder a Mis pedidos.

## 1. Crear y reutilizar un pedido

1. Agregá una unidad, elegí retiro local y efectivo, y completá nombre y email de prueba. No debe exigir DNI.
2. Continuá: no debe redirigir a Mercado Pago ni mostrar un plazo de transferencia. Guardá la referencia pública y el importe.
3. Revisá el CMS: pedido pendiente, venta local `pending_payment`, stock sin cambios y sin auditoría de efectivo.
4. Volvé al carrito y continuá con los mismos datos y productos: debe mantener la referencia y no duplicar la venta local.

## 2. Reemplazar un pedido pendiente

1. Volvé al carrito, aumentá la cantidad y continuá nuevamente.
2. Debe aparecer otra referencia y el importe actualizado. El pedido anterior debe quedar con pago cancelado; su venta local, cancelada. El stock todavía no cambia.
3. Abrí el enlace anterior: debe informar la cancelación y no pedir dinero. En Mis pedidos deben conservarse ambos intentos.
4. Intentá confirmar el anterior desde el CMS: debe rechazarlo sin modificar stock.
5. Opcionalmente repetí cambiando solo nombre o email: el nuevo pedido debe conservar los nuevos datos sin modificar el historial del anterior.

## 3. Confirmar y verificar el estado

1. Mantené abierta y visible la pantalla del pedido vigente.
2. En el CMS, abrí ese pedido y la acción **Confirmar efectivo**. Ingresá primero un importe incorrecto y marcá la casilla de recepción: debe rechazarlo sin cambiar estado ni stock.
3. Ingresá el importe exacto en **centavos ARS**. Ejemplo: para un pedido de **$ 1.000**, ingresá **100000**, sin puntos ni comas. Marcá la casilla que confirma la recepción del efectivo y confirmá.
4. Recargá el documento del CMS. Pedido aprobado, venta local pagada y auditoría con administrador, fecha, importe y movimientos de stock. Debe descontarse únicamente la cantidad comprada.
5. La pantalla del comprador debe pasar a pago confirmado en la siguiente consulta automática, aproximadamente diez segundos más el tiempo de respuesta. También podés usar **Consultar estado**. No debe seguir pidiendo que pagues.
6. Recargá la pantalla y abrí el pedido desde Mis pedidos: debe seguir aprobado. Reintentá la confirmación desde una segunda pestaña del CMS que quedó abierta antes de confirmar: no debe descontar stock otra vez.

## 4. Errores y restricciones

- **Stock insuficiente:** en otro carrito nuevo, creá un pedido pendiente y reducí el stock del producto de prueba por debajo de lo solicitado. Al confirmar, debe rechazarlo; ni pedido ni venta deben quedar pagados. Restaurá el stock de prueba al terminar.
- **Efectivo deshabilitado:** desactivá Efectivo en el CMS y recargá el carrito en una sesión nueva. No debe ofrecer ese medio.
- **Entrega:** si tenés entrega habilitada, seleccioná efectivo con retiro y luego cambiá a entrega. Debe dejar de ofrecer efectivo y seleccionar Mercado Pago. No completes un pago real.
- **Permisos:** un usuario sin rol de administrador no debe poder confirmar efectivo.
- **Privacidad:** abrí la URL del pedido en otro navegador sin las credenciales del carrito. No debe mostrar su importe ni referencia privada del detalle; debe indicar que no pudo verificar el pedido.
- **Idiomas y móvil:** repetí la navegación en ES/EN, escritorio y móvil. Comprobá foco por teclado, enlaces de regreso, Consultar estado y Mis pedidos.

## Límites conocidos

- El pago aprobado todavía no completa ni vacía automáticamente el carrito activo. Para otra compra independiente, usá una nueva sesión de prueba. El cierre común del carrito es un trabajo posterior, no un resultado esperado de esta prueba.
- Pago confirmado no significa que el pedido se haya retirado o entregado.
- No pruebes rollback sobre una base con datos reales. La suite de integración valida en una base descartable que el rollback se bloquee y conserve el historial de efectivo.

## Verificación automatizada

Desde la raíz:

```powershell
node --import ./tests/register.mjs --test tests/cash-*.test.mjs tests/transfer-retry.test.mjs tests/transfer-waiting.test.mjs tests/transfer-payment.test.mjs tests/transfer-confirmation.test.mjs
```

Desde `apps/cms`:

```powershell
node --import tsx scripts/test-transfer-confirmation.mjs
```

La integración crea y elimina su propia base PostgreSQL local. Cubre concurrencia, última unidad, autorización vigente, rollback de confirmación y reemplazo, integridad de la venta vinculada y migración. El error registrado al simular una falla parcial es intencional; las aserciones siguientes verifican que no queden cambios parciales.
