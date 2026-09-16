# Mis pedidos: acceso de invitados

## Funcionamiento

El checkout Payload guarda referencias de carrito ya autorizadas en una cookie HttpOnly, SameSite=Lax y Secure en producción. Se reutiliza el secreto de acceso existente de Payload; no se crean contraseñas ni tokens propios. Las consultas de historial filtran por la referencia completa, incluido el secreto. Un ID numérico o UUID público no autoriza el historial. No se devuelven secretos ni datos del comprador al listado.

El acceso dura 30 días desde el último checkout o recuperación y conserva hasta 20 carritos. Cambiar de navegador o borrar la cookie elimina ese acceso. La recuperación por email queda pendiente. El usuario puede recuperar pedidos anteriores vinculados al carrito actual mediante «Buscar pedidos del carrito actual»; esto exige poseer el secreto de ese carrito.

La declaración «Ya hice la transferencia» guarda `transferReportedAt` en el pedido. No cambia `paymentStatus`, inventario ni entrega. Los reintentos no renuevan automáticamente un pedido con una declaración pendiente. La página pública por UUID conserva únicamente los datos no personales existentes; para declarar un pago se exige la cookie del propietario. El endpoint rechaza escrituras de otro origen.

## Migración

Aplicá `20260916_100000_transfer_reported` con el comando de migraciones del CMS antes de desplegar esta versión. Agrega una fecha opcional a `orders`; los pedidos existentes quedan sin declaración. No aceptes un schema push que borre datos. El rollback elimina únicamente esa fecha y pierde las declaraciones almacenadas; requiere volver también a la versión anterior de la aplicación.

## Prueba manual

1. Creá un checkout por transferencia. Navegá a la tienda y abrí «Mis pedidos» con el ícono de paquete a la izquierda del carrito en el encabezado. Debe aparecer el pedido con importe, referencia y estado.
2. Abrí «Ver pedido». Debe volver a la página de espera con los mismos datos. Cerrá y volvé a abrir el navegador: el pedido debe seguir disponible.
3. Para un pedido creado antes del cambio, usá «Buscar pedidos del carrito actual». Debe recuperarse solo si el carrito actual corresponde al pedido.
4. Declaralo pagado con «Ya hice la transferencia». Recargá y volvé a Mis pedidos: debe seguir como transferencia declarada por verificar. En CMS verificá la fecha; `paymentStatus` debe seguir pendiente.
5. Intentá checkout otra vez: debe conservar el pedido declarado, sin crear otro intento. No hagas una transferencia real para esta prueba.
6. Dejá vencer un pedido distinto, sin declaración, y reintentá. El historial debe conservar ambos pedidos e indicar el intento más reciente.
7. En incógnito, Mis pedidos debe estar vacío. Conocer el UUID público no debe permitir declarar el pago. Probá una declaración desde un origen distinto: debe devolver 403.
8. Probá ES/EN, móvil/escritorio, navegación con Tab, un error temporal del CMS y el botón de recuperación sin pedidos. Borrá la cookie y verificá que el historial deje de estar accesible hasta una recuperación válida.

## Verificación automatizada

Las pruebas cubren credenciales incompletas, ausencia de acceso, consultas limitadas al propietario, ausencia de secretos en los resultados y declaraciones repetidas. La migración y las carreras de escritura requieren verificación con PostgreSQL aislado; los mocks no prueban esas garantías.
