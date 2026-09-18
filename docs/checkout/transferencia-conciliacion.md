# Conciliación automática de transferencias

## Comportamiento

- El checkout exige tipo de documento (DNI inicialmente; también CUIT/CUIL) y número del titular de la cuenta que envía la transferencia. No necesariamente es la persona que compra.
- Se normalizan separadores y se conserva el número como texto. El documento se guarda únicamente en el pedido privado y en la notificación privada: no se copia a la venta local, respuestas públicas, registros ni almacenamiento del navegador.
- La referencia UUID se puede copiar en la descripción, si el banco lo permite. Es una señal adicional, no reemplaza el documento. La descripción debe contener únicamente el UUID; referencias contradictorias requieren revisión.
- El webhook verifica la firma, consulta el pago y la cuenta receptora con credenciales de servidor y comprueba comercio, ambiente, importe y moneda antes de persistir.
- Después solicita la conciliación al CMS con su API key de administrador. No se acepta autenticación por cookie para esa operación. Una falla de persistencia o infraestructura devuelve error y permite reintentar la notificación.
- Solo se confirma un candidato único con el mismo tipo/número de documento, importe exacto, ARS y acreditación dentro del plazo del pedido. Además se exige `approved`, `accredited`, `payment_type_id=bank_transfer`, devolución cero y fecha de acreditación válida. El pedido debe seguir vigente al procesarlo.
- Tipos de pago desconocidos, datos insuficientes, ambigüedad, diferencias de importe, pagos tardíos, devoluciones, notificaciones superadas y conflictos de stock quedan en `manual_review:*`. No se descuenta stock ni se considera pagado el pedido por declarar «Ya hice la transferencia».
- Confirmación manual y automática usan la misma transacción, bloqueo, auditoría y descuento de stock. En la confirmación manual usá **el ID numérico de pago de Mercado Pago**, sin prefijos, para compartir la deduplicación. Referencias bancarias distintas no pueden reconocerse como el mismo pago.
- Una devolución posterior se registra para revisión; no cancela ni repone stock automáticamente. Las notificaciones son observaciones históricas, no el estado actual de la cuenta.
- La conciliación rechaza importes cero y fechas de acreditación posteriores a la actualización del proveedor. Las solicitudes con JSON malformado devuelven 400; las fallas de infraestructura devuelven 503 sin detalles internos. Si el pago ya se confirmó pero falla el guardado del resultado de conciliación, el reintento recupera la confirmación sin volver a descontar stock.

## Límite pendiente de verificación real

La recepción de `payment.updated` no prueba qué datos devolverá una transferencia a alias/CVU. La implementación es conservadora: no interpreta pagos con tarjeta o saldo como transferencias. Antes de habilitarla operativamente, verificá un recurso real de transferencia en la cuenta receptora: documento, `payment_type_id`, estado, importe y fechas. Si el proveedor usa otro tipo, quedará para revisión hasta validar y soportar explícitamente ese contrato. No pruebes con el ID ficticio `123456`.

Referencia del proveedor: [campos para conciliación](https://www.mercadopago.com.ar/developers/en/docs/reports/account-money/report-fields?scope=prod). Los campos del informe no garantizan por sí solos el contenido de la API de pagos.

## Despliegue y compatibilidad

1. Respaldá la base y ejecutá la migración `20260917_120000_transfer_identification` antes de desplegar ambos servicios. No hay nuevas variables de entorno.
2. Las columnas nuevas son opcionales: no borra ni inventa documentos de pedidos existentes. Esos pedidos continúan con revisión manual. Un intento vigente reutilizado conserva su documento original; los datos son inmutables.
3. El rollback elimina los documentos y resultados de conciliación agregados, **no** revierte pagos ni movimientos de stock. Requiere respaldo y detener la conciliación antes de ejecutarlo.
4. Los normalizadores de documento del storefront y CMS son espejos intencionales entre aplicaciones independientes; mantenelos sincronizados mediante la prueba de paridad.

## Prueba manual

1. En carrito y drawer, elegí transferencia: DNI aparece preseleccionado; sin documento válido el botón no se habilita. Probá DNI con puntos y CUIT/CUIL con guiones. Cambiar a Mercado Pago no exige documento.
2. Probá español e inglés, navegación por teclado y anchos móvil/escritorio. Confirmá que los campos y la explicación permanezcan accesibles.
3. Creá un pedido nuevo. Revisá en CMS el documento normalizado; verificá que no aparezca en «Mis pedidos», URL, venta local ni almacenamiento del navegador.
4. Transferí desde la cuenta con ese documento por el importe exacto, dentro del plazo. Si permite descripción, pegá el UUID con el botón existente de copiar.
5. En notificaciones, verificá `confirmed`; el pedido pasa a aprobado, la venta local a pagada y el stock baja una sola vez. La página de espera existente lo detecta al consultar el estado.
6. Reenviá la misma notificación y probá simultáneamente la confirmación manual con el mismo ID de pago: no debe descontarse nuevamente.
7. Probá documento/importe diferentes, dos pedidos candidatos sin referencia, vencimiento y falta de stock: deben quedar para revisión, sin aprobación automática.
8. Cortá temporalmente el CMS: el webhook no debe responder recepción exitosa. Al restaurarlo, el reintento debe recuperar el evento sin duplicar efectos.

Pruebas automatizadas: `node --import ./tests/register.mjs --test tests/transfer-*.test.mjs tests/mercado-pago-webhook.test.mjs tests/payment-notification-*.test.mjs`; desde `apps/cms`, `node --import tsx scripts/test-transfer-confirmation.mjs` crea y elimina una base PostgreSQL local descartable.
