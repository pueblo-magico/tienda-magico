# Confirmación manual de transferencias

## Alcance del hito

El administrador verifica una transferencia recibida en la cuenta del comercio y confirma el **pedido ecommerce existente** desde el CMS. No se consulta ni se simula un webhook de Mercado Pago. La declaración del comprador, un comprobante o una redirección no prueban recepción.

La operación `POST /api/orders/:id/confirm-transfer` requiere una sesión o credencial de administrador vigente y el origen exacto de `PAYLOAD_PUBLIC_SERVER_URL` (o la URL pública configurada del CMS). El servidor vuelve a consultar el rol del usuario para rechazar credenciales con un rol anterior. La UI usa controles nativos del sistema de componentes de Payload; no importa componentes ni dependencias del storefront.

El cuerpo contiene `reference` (ID bancario, 3–100 letras, números, guiones o guiones bajos), `amount` (centavos ARS, entero positivo), `received: true` y `acceptLate` opcional. La referencia se normaliza a mayúsculas. No uses DNI, alias, CVU, UUID del pedido ni datos personales como referencia bancaria.

## Garantías

- Solo confirma pedidos por transferencia en `processing`, con pago `pending` o `unverified`. El importe debe coincidir exactamente en ARS.
- Un vencimiento requiere aceptación explícita. No se extiende la fecha ni se modifica el snapshot. No se reservó stock durante la espera: la confirmación revalida disponibilidad en ese momento.
- Revalida producto, variante, publicación, ciclo de vida, SKU, combinación de opciones, precio en ARS, cantidades y totales del snapshot. También consulta la última versión: un borrador pendiente bloquea la operación para evitar que la actualización de inventario publique o incorpore cambios no validados. Un cambio de catálogo bloquea la operación; no reescribe precios históricos.
- Bloquea filas en PostgreSQL y actualiza stock, pago, auditoría y venta local vinculada en una sola transacción. Un conflicto revierte todos los cambios. No marca entrega ni retiro completados.
- Repetir la misma confirmación devuelve éxito sin descontar otra vez. Otra referencia sobre un pedido aprobado, la misma operación bancaria para otro pedido o un segundo intento del mismo carrito confirmado generan conflicto.
- La auditoría privada guarda actor, fecha, importe, moneda, motivo, aceptación tardía, modalidad y efectos de stock (ítem, cantidad con signo, saldo anterior/posterior y clave idempotente). La referencia bancaria es única. La venta local referencia la evidencia del pedido en vez de duplicarla.
- La confirmación y las escrituras ordinarias de pedidos/ventas locales usan bloqueos compatibles. Los registros por transferencia no permiten editar sus campos comerciales, forzar estados o borrar su auditoría. Para modificar transferencias usá operaciones individuales; las operaciones masivas se rechazan para estos registros, sin cambiar los permisos de otros medios de pago.
- El catálogo se invalida después del commit. Si la notificación falla, se registra una advertencia sin revertir el pago confirmado. Consultar carrito/checkout sigue revalidando contra el CMS; verificá también la configuración de revalidación del storefront.
- La página de espera existente consulta el estado cada diez segundos mientras está visible; al observar `approved` muestra confirmación y detiene el polling. Mis pedidos muestra el nuevo estado al cargar o actualizar la vista. La evidencia privada no se agrega a los contratos públicos.

## Migración y despliegue

1. Respaldá la base de datos y desplegá durante una ventana controlada.
2. Desde `apps/cms`, ejecutá `npm run payload -- migrate` antes de servir el código nuevo. La migración `20260917_100000_transfer_verification` agrega dos columnas opcionales y un índice único; no exige defaults ni elimina pedidos existentes.
3. Si regenerás artefactos, usá `npm run generate:types` y `npm run generate:importmap`.
4. Reiniciá el CMS y verificá que su URL pública coincida con el origen desde el cual se administra. No hay variables de entorno nuevas.

El rollback elimina las nuevas columnas de auditoría y el índice, **pero no revierte pagos ni repone stock**. No lo uses como devolución. Si ya hubo confirmaciones, preservá y conciliá la evidencia antes de cualquier rollback; volver solo al código anterior permitiría ediciones que esta versión protege. No aceptes un schema push destructivo.

## Prueba manual

Usá únicamente un entorno de prueba y evidencia ficticia. Repetí en ES/EN, a 390 px y 1440 px, con teclado.

1. Publicá un producto simple con SKU, precio ARS y stock conocido. Creá un pedido por transferencia desde el carrito, con nombre/email y retiro local. Abrí la página de espera en otra pestaña.
2. En CMS → Pedidos, abrí la referencia correspondiente. En **Verificar transferencia recibida**, ingresá un ID bancario de prueba único y el importe en centavos: `$ 1.000` corresponde a `100000`.
3. El botón debe permanecer deshabilitado sin referencia válida, importe entero positivo y aceptación de recepción. Confirmá la recepción y enviá. Mientras guarda, los controles no permiten otro envío; al terminar aparece éxito. Recargá el documento.
4. Verificá `paymentStatus: approved`, auditoría con tu ID y fecha, y stock descontado una sola vez. La venta local debe quedar `paid`/`approved`. El estado del pedido sigue `processing`, no entregado. La página de espera debe mostrar pago confirmado en su próxima consulta; Mis pedidos debe reflejarlo al actualizar.
5. Repetí la solicitud con la misma referencia/importe: debe ser idempotente. Probá otra referencia en ese pedido y reutilizá la referencia anterior en otro pedido: deben rechazarse sin cambiar stock.
6. Dejá vencer otro pedido. Sin aceptar confirmación tardía, debe fallar. Con aceptación y stock suficiente, debe aprobarse con `late: true`; sin stock, debe quedar pendiente y explicar el conflicto. Si se recibió dinero, resolvé reposición o devolución fuera de esta acción: no transfieras otra vez ni fuerces estados.
7. Cambiá el precio, discontinuá el producto o su variante, o despublicá el padre antes de confirmar otro pedido. Debe producir conflicto recuperable sin cambiar snapshot ni descontar stock. Probá también importe incorrecto.
8. Creá dos pedidos distintos para la última unidad y confirmalos desde dos sesiones. Solo uno puede aprobarse. En un pedido con dos líneas y la segunda agotada, ninguna debe descontarse.
9. Verificá productos con variantes: solo se descuenta la variante exacta. Probá también entrega online; no debe requerir una venta local.
10. Un comprador u otro rol no debe ver la acción ni poder llamar al endpoint. Probá origen ajeno/ausente y rol de administrador revocado. El acceso REST del comprador autorizado a su pedido no debe devolver `transferVerification` ni `transferBankReference`.
11. Intentá cambiar directamente `paymentStatus`, importe, snapshot o estado de la venta local, o borrar un registro por transferencia. Debe rechazarse. Una declaración «Ya hice la transferencia» simultánea no debe volver a dejar pendiente un pago aprobado.
12. Simulá una falla de red después de enviar. Consultá el estado antes de reintentar y conservá la misma referencia bancaria. Nunca interpretes un timeout como prueba de que no se guardó.
13. Sobre un producto publicado, guardá un borrador con otro precio o inventario. La confirmación debe fallar sin alterar ni publicar el borrador ni descontar el stock público. Repetí con una variante. Resolvé el borrador antes de volver a verificar el pedido.
14. En la base descartable, simulá una venta local vinculada con medio de pago o snapshot distinto al pedido. Debe rechazar la confirmación y revertir todo descuento. No hagas estas modificaciones en la base operativa.
15. Completá o enviá el formulario de verificación de un pedido y navegá a otro desde el CMS sin recargar toda la aplicación. El nuevo formulario debe empezar vacío, sin aceptaciones ni estado de éxito del pedido anterior.

## Pruebas automatizadas

Desde la raíz:

```sh
node --import ./tests/register.mjs --test tests/transfer-confirmation.test.mjs tests/transfer-payment.test.mjs tests/transfer-waiting.test.mjs tests/transfer-retry.test.mjs tests/guest-orders.test.mjs
```

Desde `apps/cms`:

```sh
node --import tsx scripts/test-transfer-confirmation.mjs
```

La integración lee la conexión local de `.env.local`, rechaza hosts no locales, crea una base descartable con nombre `transfer_test_*`, aplica la cadena de migraciones y la elimina al terminar. No usa la base de desarrollo para los fixtures. Requiere permisos para crear bases. Cubre aprobación repetida/concurrente, última unidad, rollback, cambios de catálogo, variantes, privacidad, rol revocado y migración/rollback.

## Revisión posterior contra Tareas 06/07

Este hito **no completa** esas tareas. Los efectos de stock se auditan en el pedido y consumen el `inventory` existente del plugin, mediante un servicio único para esta confirmación. Todavía no existe el ledger general, las reservas compartidas ni la proyección de saldos de Tarea 06.4. Los ajustes administrativos de inventario existentes no tienen control de versión: no hagas correcciones de stock con formularios antiguos durante ventas; este límite requiere el servicio de inventario compartido.

Quedan pendientes la matriz de personal/finanzas, efectivo y ventas asistidas, reservas/expiración persistente, conciliación automática con Mercado Pago, devolución/reembolso y movimientos compensatorios, resolución asistida de conflictos, reconciliación duradera de invalidaciones fallidas y aceptación visual completa. No conectes otro webhook o hook que descuente la misma venta independientemente de este servicio.
