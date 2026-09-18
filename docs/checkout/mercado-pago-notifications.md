# Recepción segura de notificaciones de Mercado Pago

## Alcance

Este incremento reemplaza el acuse sin firma por una bandeja privada y persistente. **Todavía no aprueba pedidos automáticamente**. No confunde una notificación con fondos recibidos ni una observación histórica con el estado actual de un pago.

El ejemplo `type: payment`, `action: payment.updated`, `data.id` corresponde a notificaciones de Payments. El ID superior identifica la notificación, no necesariamente el pago. El servidor consulta `GET /v1/payments/{data.id}` y `GET /users/me` con el token del comercio; valida ID, titular receptor, ambiente y datos monetarios antes de guardar. No usa `user_id`, importe, estado o referencia enviados por el navegador/notificación como evidencia financiera.

Una transferencia directa al alias/CVU solo entra por esta integración si Mercado Pago la expone como ese recurso y envía el evento a esta aplicación. El ejemplo del simulador no demuestra esa cobertura. No se implementan APIs de transferencias hipotéticas ni conciliación por DNI/importe.

## Configuración y despliegue

1. En Webhooks de la aplicación Mercado Pago, seleccioná **Pagos** y la URL HTTPS del storefront terminada en `/api/checkout/webhooks/mercado-pago`.
2. Configurá `MERCADOPAGO_WEBHOOK_SECRET` con la clave de firma generada allí, no con el access token. El token y secreto deben pertenecer a la misma integración. Guardalos solo en secretos del servidor.
3. En GitHub → Environment staging, agregá el secret `MERCADOPAGO_WEBHOOK_SECRET`. El deploy lo incorpora al archivo runtime privado, no a argumentos de build. Para rotarlo, actualizá el secreto y redesplegá. Sin clave válida, el endpoint falla cerrado.
4. Conservá `PAYLOAD_ECOMMERCE_URL` y `PAYLOAD_ECOMMERCE_API_KEY` configurados en el storefront. La credencial del CMS requiere administrador. No expongas esa credencial al cliente. `MERCADOPAGO_SANDBOX=true` exige recursos con `live_mode=false`; validá esta correspondencia con tu cuenta de prueba.
5. Respaldá y ejecutá las migraciones del CMS antes de desplegar el storefront. `20260917_110000_payment_notifications` agrega una colección, índices y un control de visibilidad. No modifica pedidos ni stock. El rollback elimina las observaciones: exportalas antes; no revierte pagos.
6. Reiniciá/recreá los contenedores con su configuración runtime actualizada. No hace falta reiniciar la VM.

## Garantías y límites

- Valida HMAC-SHA256 con comparación de tiempo constante usando `x-signature`, `x-request-id` y `data.id` de la URL. Exige coincidencia con `data.id` del cuerpo. No acepta IPN sin firma ni usa el ID superior como reemplazo.
- La firma autentica el recurso, no todo el JSON. El estado se obtiene de la API, nunca del cuerpo. Los reintentos antiguos siguen siendo verificables: cada recepción vuelve a consultar el recurso actual, y la clave idempotente evita repetir la misma observación. No se descuenta inventario en este flujo.
- Solo consulta URLs fijas de Mercado Pago, sin redirecciones, con timeout de cinco segundos por consulta. El cuerpo entrante se limita a 16 KiB. Configurá también timeout y rate limit del reverse proxy; no registres cuerpos ni headers sensibles.
- `200` significa que la observación ya quedó guardada (o existía idéntica), **no que el pedido esté pagado**. Errores de firma devuelven `401`; cuerpo inválido `400`; tópico no soportado `422`; respuesta de proveedor incompatible `502`; falla temporal/configuración/persistencia `503`. No se ocultan fallas como éxito; Mercado Pago puede reintentar.
- La bandeja **Tienda → Notificaciones de pago** solo es accesible a administradores. No permite editar ni borrar registros. Distintas actualizaciones se conservan separadas; el orden de llegada no determina el estado actual del pago.
- Solo persiste ID del recurso, estado observado, importe/moneda, ambiente, fecha del proveedor y referencia si es UUID. Descarta referencias de carrito con secreto, DNI, correo, datos bancarios, payloads completos y credenciales. No registra errores internos en respuestas públicas.
- Esta bandeja es operativa, no un ledger financiero ni un procesador automático de conciliación. Para resolver un caso consultá nuevamente Mercado Pago y usá la acción manual del pedido. Un registro `approved` aislado no autoriza entrega.

## Pruebas manuales

1. En un entorno aislado, simulá el evento con un **ID real de pago de prueba consultable por tu token**. El ID ficticio `123456` del ejemplo puede responder `404` en la API; en ese caso el endpoint devuelve `503` y no guarda evidencia inventada.
2. Verificá que aparezca la observación privada y que pedido, venta local e inventario no cambien. Repetí: no debe duplicarse. Revisá textos y acceso CMS en ES/EN.
3. Alterá firma o ID: no debe consultar ni guardar. Un POST sin firma debe devolver `401`; un GET solo comprueba disponibilidad y nunca procesa pagos.
4. Usá un pago de otro receptor o ambiente: debe fallar sin persistir. Simulá caída del CMS/API: debe devolver error y guardar correctamente al reintentar después de recuperar el servicio.
5. Ingresá como cliente/anónimo: no debe listar, leer ni crear observaciones. Tampoco un administrador debe modificar o borrar una observación existente.
6. Revisá que no aparezcan DNI, email, credenciales del carrito, headers ni payload completo en respuestas, logs o documentos.
7. Para habilitar el siguiente incremento, verificá un evento de transferencia real del entorno autorizado y la respuesta **redactada** de `/v1/payments/{id}`: tipo de pago, receptor, moneda, importe, estado, fecha y disponibilidad de `external_reference`. No hagas transferencias reales solo para probar sin autorización explícita.

## Verificación automatizada

Desde la raíz: `node --import ./tests/register.mjs --test tests/mercado-pago-webhook.test.mjs tests/payment-notification-storage.test.mjs`.

Desde `apps/cms`: `node --import tsx scripts/test-transfer-confirmation.mjs`. Crea y elimina una base local descartable; prueba privacidad, escritura concurrente, inmutabilidad, migración y las garantías de confirmación anteriores.

## Próximo incremento

Con el contrato de transferencia confirmado, agregar conciliación autenticada contra el servicio transaccional existente. Exigir una única referencia verificable del pedido, importe y moneda exactos, receptor correcto, ausencia de reembolso/contracargo y política explícita de pagos tardíos. Los casos sin referencia, ambiguos, con diferencias o sin stock deben quedar en revisión, nunca aprobarse por heurísticas. Preservar idempotencia de la operación bancaria entre confirmaciones manuales y automáticas.

Fuentes oficiales: [notificaciones de pagos](https://www.mercadopago.com.ar/developers/en/docs/checkout-pro-preferences/payment-notifications), [campos de reportes y referencias opcionales](https://www.mercadopago.com.ar/developers/es/docs/links-and-debts/additional-content/reports/account-money/report-fields).
