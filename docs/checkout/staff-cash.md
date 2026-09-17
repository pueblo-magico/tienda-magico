# Caja del storefront

El equipo puede confirmar efectivo desde `/es/staff/cash` o `/en/staff/cash`, sin entrar al CMS. La pantalla de espera de efectivo muestra **Confirmar pago (personal)** solo cuando caja está habilitada y pasa únicamente la referencia pública del pedido. Si la configuración no está disponible, oculta el enlace. El indicador de habilitación es público para controlar esta visibilidad; la contraseña sigue siendo privada. El enlace no autoriza el cobro por sí solo: deshabilitar caja también bloquea el acceso directo y las acciones del servidor.

## Configuración y despliegue

1. Desplegá el CMS y ejecutá sus migraciones, incluidas `20260917_140000_staff_cash` y `20260917_150000_staff_cash_commerce`, antes de habilitar la funcionalidad en la tienda.
2. Como administrador, abrí **Configuración de comercio** en el CMS.
3. Activá **Habilitar caja en la tienda** e ingresá una **Nueva contraseña de caja** de entre 12 y 128 caracteres. Guardá ambos cambios juntos la primera vez.
4. Para conservar la contraseña, dejá el campo vacío. Para rotarla, ingresá una nueva. Deshabilitar caja o cambiar la contraseña invalida todas las sesiones compartidas.
5. Abrí la página de caja desde un pedido pendiente o pegá su referencia pública luego de ingresar.

No se agrega una contraseña a `.env` ni a GitHub. El storefront reutiliza `PAYLOAD_CMS_URL` (o `PAYLOAD_ECOMMERCE_URL`) para comunicarse con el CMS. `NEXT_PUBLIC_SITE_URL` debe contener el origen público de la tienda y estar autorizado en `CORS_ORIGINS` del CMS; así también funciona cuando la URL interna del CMS difiere de su URL pública. En producción usá HTTPS en ambos servicios.

La contraseña es un campo virtual de escritura: nunca se guarda en el global ni se entrega en su respuesta pública. Payload administra su hash en una cuenta técnica sin permisos de administración, identificada internamente como `cash-staff@storefront.invalid`. No edites esa cuenta directamente. La cuenta conserva la identidad de auditoría de los cobros; compartirla no permite identificar qué integrante del equipo cobró cada pedido. El siguiente paso para auditoría individual sería usar cuentas personales.

## Cobro

1. Recibí y contá el efectivo antes de confirmar.
2. Ingresá la contraseña del equipo. La referencia se carga automáticamente si llegaste desde el pedido.
3. Revisá comprador, referencia, estado e importe. Solo se admiten pedidos de efectivo con retiro local.
4. Ingresá el importe recibido en **centavos ARS**: `$ 1.000` se ingresa como `100000`.
5. Seleccioná **Confirmar efectivo recibido**. Esta acción declara que contaste el importe exacto.
6. La operación reutiliza las validaciones, el bloqueo transaccional, el descuento único de stock, la venta vinculada y la auditoría del CMS. Completa el carrito, pero no marca entrega o retiro.
7. Cerrá la sesión al terminar, especialmente si usaste el teléfono del comprador.

Si se pierde la conexión, consultá nuevamente la misma referencia antes de reintentar. Un reintento válido es idempotente y nunca debe implicar cobrar otra vez.

## Seguridad

- Sesiones nativas de Payload; cookie del storefront `HttpOnly`, `SameSite=Strict`, `Secure` en HTTPS/producción y limitada a la API de caja. No se guardan credenciales en almacenamiento del navegador ni en URLs.
- El servidor verifica en cada consulta y confirmación la identidad técnica, el rol sin privilegios, la sesión vigente, el plazo máximo de 15 minutos y la configuración habilitada.
- La API de caja solo devuelve referencia, nombre, importe, moneda y estado. No expone DNI, email, credenciales de carrito ni auditorías internas.
- Las solicitudes que modifican estado validan `Origin`. El adaptador no sigue redirecciones ni reintenta confirmaciones automáticamente y tiene un timeout de diez segundos.
- La política nativa de `users` bloquea por 15 minutos después de cinco intentos fallidos. La misma política protege el acceso al CMS. Rotar la contraseña de caja también restablece su bloqueo.
- El alta anónima de usuarios queda limitada al bootstrap inicial. Solo administradores pueden cambiar roles; la cuenta técnica no puede entrar al administrador ni modificar su perfil o permisos.
- Los mensajes de acceso son genéricos. Un bloqueo compartido puede afectar a todo el equipo: ante abuso, deshabilitá caja y usá la confirmación administrativa existente.

## Compatibilidad y rollback

La migración inicial agrega `site_settings.cash_staff_enabled`, deshabilitado por defecto. La migración `20260917_150000_staff_cash_commerce` traslada ese estado a `commerce_settings.cash_staff_enabled` y elimina la columna anterior. Conserva la contraseña y las sesiones existentes; su rollback devuelve el estado a Configuración del sitio sin modificar credenciales. Ejecutá las migraciones antes de iniciar el CMS actualizado; no reemplaces este traslado por un schema push. La contraseña usa las tablas de autenticación existentes. No se modifican pedidos ni sus auditorías.

El rollback de la migración inicial (después de revertir el traslado) revoca las sesiones de la cuenta técnica, elimina su hash y salt y quita la columna de configuración. Conserva la cuenta para no perder la identidad de la auditoría. Después de volver a desplegar, configurá una contraseña nueva antes de habilitar caja. No reviertas las correcciones de autorización de usuarios al restaurar una versión anterior.

## Pruebas manuales

- Sin contraseña configurada o con caja deshabilitada, verificá que no se pueda ingresar ni consultar pedidos.
- Creá un pedido en efectivo. Desde su pantalla pendiente, abrí **Confirmar pago (personal)**; no deben mostrarse los datos de cobro antes de ingresar.
- Probá una contraseña incorrecta y luego la correcta. Revisá la referencia cargada y confirmá un importe incorrecto: debe rechazarse sin cambiar stock, estado ni carrito.
- Ingresá el importe exacto. Comprobá pago aprobado, stock descontado una sola vez, carrito vacío y pedido conservado en «Mis pedidos».
- Volvé a consultar el pedido: debe verse aprobado y sin botón para cobrar. Probá otro medio de pago o una referencia inexistente; no debe permitirse confirmarlo.
- Cerrá sesión y recargá. Volvé a ingresar y luego rotá la contraseña o deshabilitá caja desde el CMS: la próxima acción debe rechazar la sesión anterior.
- Esperá 15 minutos y verificá que sea necesario ingresar nuevamente. Probá cinco contraseñas incorrectas: el acceso debe permanecer bloqueado temporalmente incluso con la correcta.
- Repetí en EN/ES, con teclado y a ancho móvil. No guardes la contraseña del personal en el navegador del cliente.

## Pruebas automatizadas

Desde la raíz:

```powershell
node --import ./tests/register.mjs --test tests/cash-waiting.test.mjs
node --conditions=react-server --import ./tests/register.mjs --test tests/staff-cash-route.test.mjs
```

Desde `apps/cms`:

```powershell
node --import tsx scripts/test-transfer-confirmation.mjs
```

La integración usa una base local descartable e incluye autorización, CSRF, privacidad, importe, idempotencia, cierre del carrito, logout, rotación, bloqueo, vencimiento de sesiones y protección contra cambios de rol.
