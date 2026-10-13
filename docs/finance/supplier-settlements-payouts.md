# Liquidaciones y pagos a proveedores

Este flujo registra la deuda con proveedores por consignación y exige una confirmación explícita de un administrador antes de enviar dinero. Los perfiles, liquidaciones y pagos son privados para los roles de finanzas y administración; solamente administración puede verificar destinos, aprobar liquidaciones y confirmar el envío.

## Alcance actual

1. La transición de un pedido a pago aprobado crea como máximo una obligación por línea mediante una clave de origen única.
2. Los términos efectivos de compra no generan deuda por cada venta.
3. Los términos de consignación calculan la participación por porcentaje o importe fijo usando unidades menores enteras, sin aritmética de punto flotante.
4. Cada obligación conserva un snapshot del pedido, producto, variante, proveedor, acuerdo, revisión, términos y versión del cálculo. Un acuerdo faltante o ambiguo queda retenido para revisión.
5. Las obligaciones elegibles del mismo pedido, proveedor y moneda se agrupan automáticamente en una liquidación borrador idempotente; no se pueden crear liquidaciones arbitrarias desde la API o el panel.
6. Un administrador revisa y aprueba la liquidación.
7. La aprobación exige un único perfil verificado del mismo proveedor y moneda; dentro de la misma transacción prepara automáticamente un pago por el saldo total. Si falta el perfil, la liquidación continúa en borrador y no se envía dinero.
8. El administrador revisa proveedor, importe, moneda y destino, marca la confirmación y recién entonces solicita el envío.
9. Una respuesta HTTP `202` de Mercado Pago se registra como `submitted`; no se considera dinero acreditado.
10. La acción de conciliación consulta la transacción. Solamente `success` con detalle `accredited` cierra la liquidación como pagada.
11. Un resultado incierto pasa a `reconciliation_required`. No se reenvía automáticamente con otra clave idempotente.

La primera integración está limitada deliberadamente a ARS, al pago total del saldo pendiente y al modo de prueba de Mercado Pago Payouts. La asignación de descuentos, impuestos, envío y comisiones que no estén representados en el total de línea, los ajustes por devolución y la consolidación de varios pedidos en una liquidación periódica siguen siendo incrementos posteriores.

## Configuración local

En `apps/cms/.env`:

```dotenv
MERCADOPAGO_PAYOUTS_ACCESS_TOKEN=TEST-reemplazar-con-token-de-payouts
MERCADOPAGO_PAYOUTS_TEST_MODE=true
MERCADOPAGO_PAYOUTS_WEBHOOK_URL=https://cms.example.test/api/webhook
```

La credencial debe pertenecer a Payouts y no debe reutilizarse en el navegador ni en el checkout público. La URL de notificación es opcional y, si se define, debe usar HTTPS.

## Operación con Mercado Pago de prueba

1. En **Finanzas > Perfiles de pago**, crear el destino del proveedor. Un administrador debe marcarlo como verificado.
2. Confirmar un pedido consignado como pagado y abrir la liquidación borrador que el sistema preparó en **Finanzas > Liquidaciones**.
3. Revisar proveedor, moneda e importe contra las obligaciones vinculadas y aprobarla desde la acción del documento. El sistema prepara el pago sin enviarlo.
4. En **Finanzas > Pagos a proveedores**, abrir el pago preparado y comprobar liquidación, proveedor, saldo y perfil.
5. Aceptar la advertencia y usar **Confirmar y enviar**. Este es el único paso que solicita el movimiento de dinero.
6. Si el estado queda enviado, procesando o requiere conciliación, usar **Consultar estado en Mercado Pago**.
7. No crear ni confirmar otro pago ante un resultado incierto. Conciliar primero la misma transacción por su identificador externo.

## Registro de una transferencia manual

Cuando Mercado Pago Payouts no esté disponible, un administrador puede registrar una transferencia que ya se realizó fuera del sistema desde el pago preparado:

1. Abrir el pago en **Finanzas > Pagos a proveedores** y verificar proveedor, liquidación, destino, moneda e importe.
2. En **Registrar pago manual**, ingresar la fecha efectiva —no futura ni anterior a la aprobación— y una referencia externa única del banco o medio de pago.
3. Usar **Revisar pago**. La confirmación muestra nuevamente importe, fecha y referencia y aclara que la acción no transfiere dinero.
4. Confirmar únicamente después de verificar el movimiento externo. El sistema registra el actor y la fecha, marca el pago como manual y conciliado, y cierra la liquidación y sus obligaciones dentro de una transacción.
5. Si el resultado no es concluyente, no volver a registrar el movimiento hasta revisar el estado del pago.

Este primer incremento manual cubre únicamente el saldo completo de una liquidación aprobada. Los pagos parciales requieren asignación determinista entre obligaciones y permanecen como incremento posterior. No se adjuntan comprobantes hasta disponer de almacenamiento privado, autorización y validación de archivos.

La referencia manual posee una restricción única en PostgreSQL además de la validación previa de la aplicación. La migración agrega columnas anulables y un método con valor predeterminado `mercado-pago`, por lo que los pagos existentes conservan compatibilidad. La reversión elimina solamente esos campos e índice; no revierte transferencias externas ni debe ejecutarse después de registrar pagos manuales sin exportar previamente la auditoría.

## Límite de producción

La configuración rechaza el envío cuando `MERCADOPAGO_PAYOUTS_TEST_MODE` no es `true`. Antes de habilitar producción se debe confirmar la elegibilidad de la cuenta, implementar la firma exigida por Mercado Pago, validar credenciales y callbacks en el entorno de despliegue, y completar pruebas de integración con un entorno autorizado. No se debe quitar este bloqueo para resolver un error de configuración.
