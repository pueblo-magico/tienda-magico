# Liquidaciones y pagos a proveedores

Este flujo registra la deuda con proveedores por consignación y exige una confirmación explícita de un administrador antes de enviar dinero. Los perfiles, liquidaciones y pagos son privados para los roles de finanzas y administración; solamente administración puede verificar destinos, aprobar liquidaciones y confirmar el envío.

## Alcance actual

1. La transición de un pedido a pago aprobado crea como máximo una obligación por línea mediante una clave de origen única.
2. Los términos efectivos de compra no generan deuda por cada venta.
3. Los términos de consignación calculan la participación por porcentaje o importe fijo usando unidades menores enteras, sin aritmética de punto flotante.
4. Cada obligación conserva un snapshot del pedido, producto, variante, proveedor, acuerdo, revisión, términos y versión del cálculo. Un acuerdo faltante o ambiguo queda retenido para revisión.
5. Una liquidación se prepara en borrador y un administrador la aprueba.
6. El pago referencia una liquidación aprobada y un perfil de pago verificado del mismo proveedor.
7. El administrador revisa proveedor, importe, moneda y destino, marca la confirmación y recién entonces solicita el envío.
8. Una respuesta HTTP `202` de Mercado Pago se registra como `submitted`; no se considera dinero acreditado.
9. La acción de conciliación consulta la transacción. Solamente `success` con detalle `accredited` cierra la liquidación como pagada.
10. Un resultado incierto pasa a `reconciliation_required`. No se reenvía automáticamente con otra clave idempotente.

La primera integración está limitada deliberadamente a ARS, al pago total del saldo pendiente y al modo de prueba de Mercado Pago Payouts. La asignación de descuentos, impuestos, envío y comisiones que no estén representados en el total de línea, los ajustes por devolución y la agrupación automática en liquidaciones siguen siendo incrementos posteriores.

## Configuración local

En `apps/cms/.env`:

```dotenv
MERCADOPAGO_PAYOUTS_ACCESS_TOKEN=TEST-reemplazar-con-token-de-payouts
MERCADOPAGO_PAYOUTS_TEST_MODE=true
MERCADOPAGO_PAYOUTS_WEBHOOK_URL=https://cms.example.test/api/webhook
```

La credencial debe pertenecer a Payouts y no debe reutilizarse en el navegador ni en el checkout público. La URL de notificación es opcional y, si se define, debe usar HTTPS.

## Operación manual

1. En **Finanzas > Perfiles de pago**, crear el destino del proveedor. Un administrador debe marcarlo como verificado.
2. En **Finanzas > Liquidaciones**, crear un borrador en ARS y aprobarlo desde la acción del documento.
3. En **Finanzas > Pagos a proveedores**, crear un pago por el saldo total, seleccionando el mismo proveedor, liquidación y perfil.
4. Revisar todos los datos, aceptar la advertencia y usar **Confirmar y enviar**.
5. Si el estado queda enviado, procesando o requiere conciliación, usar **Consultar estado en Mercado Pago**.
6. No crear ni confirmar otro pago ante un resultado incierto. Conciliar primero la misma transacción por su identificador externo.

## Límite de producción

La configuración rechaza el envío cuando `MERCADOPAGO_PAYOUTS_TEST_MODE` no es `true`. Antes de habilitar producción se debe confirmar la elegibilidad de la cuenta, implementar la firma exigida por Mercado Pago, validar credenciales y callbacks en el entorno de despliegue, y completar pruebas de integración con un entorno autorizado. No se debe quitar este bloqueo para resolver un error de configuración.
