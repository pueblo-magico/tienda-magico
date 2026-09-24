# Cuentas opcionales de clientes

## Alcance

- `/es/mi-cuenta` y `/en/account`: registro, ingreso y consulta de nombre/email.
- El menú de cuenta reemplaza el acceso directo del encabezado a Mis pedidos y conserva su contador de pagos pendientes.
- El checkout permite crear una cuenta sin salir del carrito o continuar como invitado. Una cuenta autenticada puede copiar sus datos al formulario; no se modifica el comprador sin su intervención.
- Mis pedidos combina las referencias de invitado del navegador con los pedidos vinculados a la cuenta, disponibles en otros dispositivos. El límite de 20 carritos/30 días sigue aplicando únicamente a la cookie de invitado.
- La ficha «Mis datos» es de consulta en esta versión. Los clientes no pueden modificar usuarios, roles, sesiones ni claves API mediante el endpoint genérico del CMS. La administración conserva sus permisos.

## Seguridad y configuración

Se utiliza la autenticación y las sesiones nativas de Payload. La contraseña se envía solamente al sistema de autenticación y nunca se guarda en el navegador. La cookie `magico_customer` es HttpOnly, SameSite=Lax, Secure en producción, con duración máxima de dos horas. Cerrar sesión revoca la sesión en el CMS antes de borrar la cookie. Las respuestas de cuenta no se cachean y las escrituras exigen el mismo origen.

El registro requiere las variables existentes `PAYLOAD_CMS_URL` y `PAYLOAD_CMS_API_KEY` (o sus alternativas `PAYLOAD_ECOMMERCE_*`). La clave debe pertenecer a un usuario de servicio autorizado para crear usuarios. La API del storefront fija `roles: ['customer']` y desactiva claves API; nunca acepta privilegios enviados por el navegador. Configurá `NEXT_PUBLIC_SITE_URL` con el origen real del storefront y autorizá ese origen en CSRF del CMS. No se agregan secretos nuevos ni argumentos de build.

El storefront limita los intentos a cinco por email y 300 globales por minuto por proceso; Payload conserva su bloqueo nativo tras cinco contraseñas incorrectas. Para múltiples réplicas, agregá un límite distribuido en el proxy/plataforma para `/api/account` y `/api/users/login`. El límite local no coordina procesos ni sustituye la protección del perímetro.

El email todavía no se verifica y esta versión no incorpora recuperación de contraseña. **Un email coincidente nunca acredita propiedad de un pedido.** Para vincular pedidos anteriores se requiere la referencia completa con el secreto de carrito que ya posee el navegador. La vinculación usa una transacción y un bloqueo por carrito; no reasigna pedidos de otra cuenta ni adopta intentos hermanos cuando alguno ya pertenece a otra persona. Las referencias privadas se usan solo en la comunicación entre servidores y no aparecen en las respuestas del storefront ni se copian a la cookie de invitados al consultar la cuenta desde otro dispositivo.

## Persistencia y compatibilidad

Se reutilizan `orders.customer` y las sesiones ya existentes de `users`: no hay campos nuevos ni una migración de esquema adicional. Aplicá las migraciones existentes del repositorio antes de verificar la integración. Volver a la versión anterior no elimina las relaciones guardadas; dejarían de usarse en el storefront. No se vincula historial por email ni se realiza un backfill masivo.

## Prueba manual

1. En ES, creá un pedido como invitado. Abrí Mi cuenta → Crear cuenta en ese mismo navegador. Revisá el nombre/email y comprobá que Mis pedidos conserva el pedido.
2. En otro navegador sin cookies previas, ingresá con esa cuenta. El pedido debe aparecer y permitir las mismas acciones autorizadas que antes.
3. Cerrá sesión en el segundo navegador: el historial de la cuenta debe desaparecer. Una cuenta diferente no debe ver esos pedidos. Los pedidos de invitado que el primer navegador ya poseía siguen disponibles allí.
4. Creá otra cuenta con otro email e intentá recuperar el mismo carrito. No debe cambiar `orders.customer` ni vincular los intentos hermanos a la segunda cuenta.
5. Desde checkout, completá nombre/email, creá una cuenta opcional y continuá la compra. Probá también continuar sin registrarte. El historial de otro dispositivo debe mostrar el pedido nuevo de la cuenta.
6. Probá contraseña incorrecta, email ya registrado, sesión vencida/revocada, CMS apagado y solicitudes desde otro origen. No deben aparecer contraseñas, tokens o detalles internos en respuestas o logs. La compra como invitado no requiere iniciar sesión.
7. Repetí en EN, a 375 px y 1280 px. Abrí el menú con teclado, recorré con flechas, cerrá con Escape y verificá el contador accesible.

## Verificación automatizada

```powershell
node --conditions=react-server --import ./tests/register.mjs --test tests/account-*.test.mjs tests/customer-session.test.mjs tests/cms-users.test.mjs tests/guest-orders.test.mjs
node --import ./tests/register.mjs --test tests/cart-summary.test.mjs tests/customer-account-ui.test.mjs
cd apps/cms
node --import tsx scripts/test-transfer-confirmation.mjs
```

La última suite crea y elimina una base PostgreSQL descartable; requiere el servidor local indicado en `apps/cms/.env.local`. Comprueba propiedad, intentos hermanos, sesiones revocadas y cierre de sesión sobre persistencia real. Los tests con mocks no sustituyen esa comprobación antes de desplegar.
