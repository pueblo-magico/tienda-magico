# Plan: Tarea 06, comercio mixto e inventario compartido

Estado: planificado. Depende de: 04, 05. Las reservas de checkout, los webhooks
de pago, la conciliación de pagos y las carreras por la última unidad del
checkout siguen siendo responsabilidad de la Tarea 07.

## Objetivo y prioridad

Conectá la tienda física autogestionada con el catálogo y checkout existentes
del ecommerce sin crear un segundo catálogo, fuente de precios, carrito o flujo
de pago. La primera versión debe permitir que una persona descubra y compre de
forma autónoma desde el webshop, elija explícitamente retiro local o entrega, y
le dé a la tienda un registro operativo de venta local. La misma identidad del
ítem vendible, precio, disponibilidad y contratos de pago deben mantenerse en
ambos recorridos.

El orden de prioridad es:

1. Compra autónoma en el webshop con elección explícita de compra local y un
   registro de venta local.
2. Descubrimiento de productos mediante cámara en el webshop.
3. Asistencia técnica del personal para el mismo flujo de compra ecommerce.
4. Inventario compartido y controles operativos de stock.
5. Eventos, retiros, asignaciones y liberaciones.

El checkout online sigue siendo el recorrido de compra autoritativo. El retiro
local no es un segundo checkout, POS ni bypass de pago: es una modalidad de
fulfillment asociada al producto, carrito, cotización, pago y pedido existentes.

## Etapa 1: compra local autónoma desde el webshop

### Flujo de la persona compradora

La persona abre el webshop mediante navegación normal, búsqueda, una URL directa
del producto o un enlace compartido por el personal. No se requiere un código
QR por producto y no hay una función QR en esta etapa. Revisa el producto y su
disponibilidad actual, selecciona el producto o variante exactos y los agrega al
carrito existente.

Antes de finalizar el pedido, debe elegir de forma explícita, localizada y
accesible por teclado entre:

- **Compra local / retiro:** la persona está en la tienda física, retira allí
  la compra y no necesita entrega, envío ni dirección de entrega.
- **Compra online / entrega:** continúan los requisitos normales de fulfillment
  del ecommerce.

La elección no debe inferirse por URL, IP, red Wi-Fi, ubicación del dispositivo
ni señal de analítica. Debe persistir en el carrito, checkout, retorno del pago
y vistas del pedido. La persona puede cambiarla antes de finalizar, según las
reglas de validación de la modalidad elegida.

Ambas modalidades usan los mismos contratos de catálogo, precios, identidad de
variante, disponibilidad, carrito, cotización de checkout, pago y pedido. El
retiro local cambia el fulfillment y la operación, no el precio, la moneda, la
autoridad del pago ni la validación de stock.

### Registro de venta local

Elegir retiro local crea o actualiza un registro privado de venta local vinculado
al pedido ecommerce autoritativo. Debe usar una clave de idempotencia para que
los reintentos de cotización, checkout, recargas, callbacks duplicados y tareas
de conciliación no creen registros ni movimientos duplicados.

El registro de venta local de la primera etapa incluye:

- canal local y tienda/local seleccionado, si se soportan múltiples locales;
- referencia del pedido ecommerce y datos de comprador/contacto permitidos;
- timestamps de creación, actualización, pago, retiro y auditoría;
- snapshots inmutables de IDs de producto/variante, SKU, título localizado,
  opciones seleccionadas, cantidades, precios unitarios, moneda y total del
  pedido;
- modalidad de fulfillment, sin requerir dirección de envío para el retiro;
- estado de pago autoritativo y estado operativo;
- preparación para retiro, estado retirado/cancelado y metadata de auditoría,
  sin guardar credenciales de pago, secretos del carrito invitado ni secretos
  del gateway.

El redirect de éxito del pago en el navegador nunca es prueba de pago. El
registro sigue el estado autoritativo de la integración de checkout existente.
Los pagos pendientes, rechazados, cancelados, tardíos o no verificados deben
seguir siendo estados accionables y no presentarse como compras retiradas.

### Efecto de inventario y límite entre registros

Cuando el pago queda autoritativamente confirmado, el pedido local del webshop
debe producir exactamente un efecto idempotente de stock usando el pool de
inventario compartido. Los pedidos pendientes no reducen stock. El efecto debe
ser atómico, rechazar disponibilidad insuficiente y conservar un conflicto
recuperable si otro canal consumió el stock primero. La Tarea 07 es responsable
del momento de reserva online y de las carreras de pago; este plan es
responsable del límite de retiro local y de su conexión con el servicio de
inventario compartido.

La relación entre el registro comercial de venta local y el movimiento del ledger
de inventario queda como decisión explícita de implementación:

- **Registros separados vinculados:** la venta local es el registro
  comercial/pedido y el movimiento del ledger es el registro de stock, unidos
  por un ID de movimiento inmutable.
- **Registro unificado:** un registro contiene los datos comerciales de la venta
  local y el movimiento de stock, conservando los campos de auditoría del
  ledger.

Antes de implementar el esquema, elegí un modelo y documentá cómo se comportan
los reintentos, reembolsos, cancelaciones, devoluciones y conciliaciones
manuales. En cualquiera de los modelos, el sistema debe impedir descuentos
duplicados y no debe tratar un ajuste de stock como prueba de pago.

### Comportamiento del flujo local

- Mostrá una indicación localizada y clara de la modalidad local o de entrega
  elegida, incluyendo que el retiro local no tiene etapa de entrega.
- Conservá la modalidad sin colocar secretos ni datos de pago en URLs.
- Cambiar la modalidad nunca debe cambiar la identidad del producto, reemplazar
  silenciosamente una variante seleccionada ni saltear validaciones de checkout.
- Revalidá precio, ciclo de vida, disponibilidad y cantidad en los límites de
  cotización/checkout; conservá las líneas no afectadas cuando una línea deje
  de ser válida.
- Ante un error de inventario o checkout, mostrale a la persona un estado
  recuperable e impedí una compra no verificada en vez de asumir disponibilidad.
- No expongas stock exacto, cantidades reservadas/asignadas, umbrales de
  reposición, locales internos ni notas exclusivas del personal.

### Aceptación de la Etapa 1

- Una persona puede encontrar un producto en el webshop y completar el flujo
  existente de carrito a Mercado Pago sin intervención del personal.
- Debe elegir retiro local o entrega antes de finalizar, y la elección aparece
  en el estado del carrito y del pedido.
- El retiro local no requiere dirección ni etapa de envío; la entrega conserva
  los requisitos normales de fulfillment.
- Una compra local crea exactamente un registro de venta local idempotente
  vinculado al pedido ecommerce.
- La confirmación autoritativa del pago produce exactamente un efecto
  idempotente en el stock compartido; un pago pendiente o no verificado no
  produce ninguno.
- Un conflicto de stock deja el registro accionable y nunca sobrevende de forma
  silenciosa.
- Los errores de pago, precio, disponibilidad, discontinuación, carrito
  desactualizado y servicio de inventario usan estados localizados y accesibles
  de recuperación.
- La modalidad elegida sobrevive cambios de idioma, recargas del carrito,
  handoff al checkout, retorno del pago y consulta segura del pedido sin cambiar
  identidad ni precio.

## Etapa 2: descubrimiento de productos mediante cámara

Después de estabilizar la Etapa 1, agregá una entrada optativa de cámara en el
webshop. La persona puede fotografiar un producto físico o su envase y recibir
uno o más candidatos. Debe confirmar un candidato antes de abrir la página del
producto y todavía debe elegir explícitamente retiro local o entrega. El
reconocimiento nunca elige modalidad de fulfillment, variante, precio ni compra.

La primera versión trata el reconocimiento de imágenes como ayuda para descubrir
productos, no como decisión autoritativa de producto o compra:

1. Pedí permiso para la cámara solo después de que la persona elija la acción de
   escaneo.
2. Capturá la imagen localmente cuando sea posible y explicá si hace falta
   subirla.
3. Enviála mediante un límite de reconocimiento del lado servidor o un proveedor
   aprobado; las credenciales del proveedor nunca entran al navegador.
4. Devolvé candidatos ordenados por confianza, con etiquetas visibles de
   producto/variante.
5. Exigí confirmación explícita del candidato antes de navegar.
6. Abrí la página confirmada mediante la navegación normal del webshop.
7. Ofrecé búsqueda de texto o asistencia del personal ante baja confianza,
   permiso denegado, cámara no disponible, uso offline, timeout o error de
   reconocimiento.

No uses reconocimiento facial, no infieras la identidad de la persona, no
retengas imágenes por defecto ni afirmes que una coincidencia visual prueba un
SKU específico. El reconocimiento no debe alterar precio, disponibilidad,
variante, modalidad de fulfillment ni validación de checkout. Definí reglas de
retención y eliminación antes de guardar imágenes o resultados.

### Aceptación de la Etapa 2

- Los navegadores móviles soportados manejan permiso denegado, cámara no
  disponible, offline, timeout, error de subida y baja confianza.
- Un resultado incierto nunca agrega automáticamente un ítem al carrito.
- Un resultado confirmado abre la misma página de producto sin elegir retiro o
  entrega por la persona.
- Las alternativas de búsqueda de texto y asistencia del personal son útiles y
  accesibles.
- Las imágenes, solicitudes y resultados no filtran datos personales ni
  credenciales del proveedor, y no se retienen sin una política aprobada.

## Etapa 3: asistencia técnica del personal

Una vez usable el descubrimiento autónomo, el personal puede acompañar a la
persona sin operar un checkout separado. Puede:

- abrir o compartir la URL correcta del producto o un resultado de búsqueda;
- buscar el catálogo y seleccionar la variante correcta;
- explicar disponibilidad, precio, contenido neto, retiro local versus entrega
  y pasos del checkout;
- ayudar a recuperar carritos desactualizados, productos no disponibles,
  redirects de pago fallidos o problemas de cámara; y
- devolver a la persona a su dispositivo y sesión de pago cuando sea posible.

El personal no puede editar precios controlados por el cliente, saltear
validaciones de checkout, exponer saldos privados ni marcar un pago como
completo desde una página de éxito del navegador. Los registros de asistencia
deben usar una referencia opaca de sesión/contexto y nunca copiar credenciales
de pago ni secretos de carritos invitados.

Más adelante puede agregarse un flujo de venta asistida operado por personal
para datos de contacto de compradores invitados, `cash` o
`mercado_pago_transfer` verificado manualmente, snapshots comerciales
inmutables y estados de borrador, pago pendiente, pagado y cancelado. Los
registros pendientes no deben reducir ni reservar stock; la confirmación debe
revalidar precio y disponibilidad y crear exactamente un movimiento de
inventario idempotente. Este flujo es separado del registro de venta local del
webshop de la Etapa 1.

### Flujo de venta local operado por personal

La colección CMS es privada y está disponible solo para personal autorizado y
administradores. Los clientes no pueden crear, actualizar, confirmar, cancelar
ni consultar estos registros mediante APIs públicas. El personal puede crear
una venta para una persona invitada sin requerir una cuenta. Cada mutación
guarda actor, timestamp, referencia de solicitud/idempotencia y un motivo apto
para auditoría.

El registro tiene estados explícitos y transiciones permitidas:

- `draft`: el personal todavía carga ítems, datos del comprador y método de pago;
- `pending_payment`: la venta está completa para esperar evidencia de pago;
- `paid`: el personal verificó el pago y el movimiento de inventario terminó;
- `cancelled`: la venta no se completará y no tiene una confirmación pendiente;
- `conflict`: puede existir evidencia de pago, pero el precio o la disponibilidad
  cambió antes de confirmar y el personal debe resolverlo explícitamente.

La implementación debe rechazar transiciones inválidas, confirmaciones repetidas
y ediciones de campos inmutables después de confirmar snapshot o stock. Una venta
cancelada o en conflicto no puede reutilizarse silenciosamente como una venta
nueva; el personal debe crear un nuevo intento o usar el flujo de corrección
exclusivo de administradores.

### Propiedad y verificación del pago

Este flujo es responsable de registrar pagos manuales; no llama a Mercado Pago
para autorizar ni confirmar automáticamente una transferencia. Los métodos
soportados son:

- `cash`: el personal registra que recibió efectivo, quién lo recibió, importe,
  moneda, hora y nota opcional;
- `mercado_pago_transfer`: el personal registra referencia de transferencia,
  importe, moneda, hora y nota del pagador, y confirma explícitamente que
  revisó la referencia y el importe en la cuenta de Mercado Pago.

La evidencia de pago es privada. Una referencia de transferencia, imagen de
comprobante o afirmación del personal por sí sola no cambia la venta a `paid`;
la acción de personal autorizado debe validar moneda e importe esperados y
registrar quién verificó. El sistema nunca debe exponer credenciales del
gateway, permitir que el cliente marque una transferencia como verificada ni
implicar que un redirect del navegador verificó una transferencia manual. Si el
importe, moneda, referencia o estado de pago es incierto, la venta permanece en
`pending_payment` o pasa a `conflict`.

### Snapshots, confirmación y stock

Al crear y antes de confirmar, el CMS lee el producto o variante autoritativos y
guarda un snapshot inmutable con IDs de producto/variante, SKU, título
localizado, opciones seleccionadas, cantidad, precio unitario, moneda y total.
El personal no puede editar precio ni identidad del snapshot para forzar una
confirmación.

Las ventas en `draft` y `pending_payment` no reservan ni reducen stock. Confirmar
una venta ejecuta una operación atómica que:

1. revalida ítem vendible, ciclo de vida, precio, moneda y cantidad disponible
   actuales contra el snapshot;
2. verifica evidencia de pago manual y personal autorizado;
3. crea exactamente un movimiento idempotente en el ledger de inventario; y
4. cambia la venta a `paid` solo si el movimiento termina correctamente.

Si cambió precio, moneda, ciclo de vida o disponibilidad, la venta pasa a
`conflict` y queda pendiente de una decisión explícita del personal. No debe
descontar stock, confirmar parcialmente ni reemplazar silenciosamente el ítem o
la cantidad. Una confirmación repetida con la misma clave de idempotencia
devuelve el resultado existente y no crea un segundo movimiento. Una transacción
fallida deja la venta y la evidencia de pago recuperables sin declarar éxito.

### Reversiones y protecciones operativas

El personal autorizado puede cancelar antes del pago o de confirmar stock. Las
devoluciones, reembolsos, cancelaciones posteriores a `paid` y reversiones de
movimientos de stock requieren permiso documentado de administrador, motivo y
un movimiento compensatorio idempotente; nunca reescriben el snapshot original
ni eliminan su historial de auditoría. La primera implementación debe definir
si un no-show se cancela, se devuelve o queda para resolución manual.

El CMS debe mostrar estados pendiente, guardando, éxito, falla y conflicto, con
una acción segura de actualizar/reintentar. Debe distinguir el registro de
venta/pago local de un ajuste de inventario y no exponer saldos exactos a
clientes. Este flujo no implementa sincronización offline: guardar, verificar
pago, confirmar y mutar stock requieren conexión activa con el CMS.

## Etapa 4: inventario compartido y registros operativos

La Etapa 4 implementa un único pool de inventario compartido para compras
online, pedidos locales de la Etapa 1, ventas asistidas posteriores, ventas de
retiro y operaciones de eventos.

### Contrato de inventario

Para cada ítem vendible, proveé:

- cantidad física disponible;
- cantidad reservada activa;
- cantidad asignada activa para eventos;
- cantidad disponible, calculada como físico menos reservas activas,
  asignaciones y cualquier stock de seguridad documentado;
- umbral privado de reposición y metadata de conteo; y
- un único dueño documentado de la proyección del inventario del plugin.

No debe existir un campo de disponibilidad editable de forma independiente ni
hooks duplicados que descuenten dos veces el mismo efecto. Los saldos exactos,
umbrales, asignaciones y notas operativas permanecen privados. El catálogo
público expone solo disponibilidad localizada y, cuando sea compatible con la
privacidad, un límite seguro de compra que es un tope de política y no una
lectura de stock exacta.

### Ledger y mutaciones

Agregá un ledger auditable con ítem vendible, cantidad con signo, motivo, canal,
actor, timestamp y referencia de idempotencia. Los motivos incluyen recepción,
venta web, venta web local, venta asistida/offline, devolución, daño,
corrección y conciliación de conteo físico. Los canales incluyen web, tienda
local, retiro y evento.

Todas las mutaciones usan autorización, validación, actualizaciones atómicas,
protección contra stock negativo e idempotencia. Los pedidos repetidos no pueden
descontar dos veces y las actualizaciones en competencia no pueden perder
escrituras. Restringí la edición directa del campo `inventory` del plugin una
vez establecido el dueño del inventario compartido.

El conteo físico registra cantidad contada, actor, fecha, ajuste calculado y la
versión/saldo de origen usado para calcularlo. Los cambios concurrentes deben
producir un conflicto con una ruta segura de actualizar/reintentar en vez de
sobrescribir movimientos nuevos. Se pueden registrar ajustes de conversión
manual para soporte futuro de granel, pero no se implementa un motor de
empaquetado.

### Flujo CMS

El personal autorizado puede inspeccionar saldos e historial privados, registrar
recepciones, ventas locales/offline, devoluciones, daños, correcciones y
conciliaciones de conteo, y luego asignar o liberar stock de eventos. El CMS
debe mostrar actor, canal, motivo, timestamps, validación, estados de guardado o
falla y conflictos de concurrencia. Debe distinguir claramente un ajuste de
inventario de un registro de pago o contabilidad.

Los permisos de clientes, personal, responsables y administradores deben ser
explícitos. El personal no puede sobrescribir cantidades calculadas ni saltear
permisos mediante APIs. Las acciones destructivas, financieras, de reembolso,
devolución y reversión de ventas confirmadas requieren permisos y entradas de
auditoría documentados.

### Comportamiento del storefront y carrito

Las cards, listados, productos destacados, cards relacionadas, detalles y
selectores de variantes usan disponibilidad pública del pool compartido. Los
ítems agotados no están disponibles y no se pueden comprar. La disponibilidad
minorista nunca debe inferirse desde stock de proveedor o granel.

Después de una venta local, venta asistida, asignación u otra mutación de
inventario:

- revalidá los carritos al cargar, cambiar cantidades y entrar al checkout;
- identificá las líneas afectadas y ofrecé acciones localizadas para ajustar
  cantidad, quitar o volver al producto;
- conservá las líneas no afectadas y nunca elimines ni reemplaces variantes en
  silencio;
- mostrale al cliente el rechazo de inventario en checkout con regreso
  accionable al carrito;
- invalidá o revalidá las superficies de catálogo afectadas bajo una política
  de frescura documentada; y
- fallá de forma cerrada con un estado recuperable cuando el servicio de
  inventario no pueda verificar disponibilidad.

La Tarea 07 sigue siendo responsable de reservas atómicas del checkout online,
expiración, verificación de webhooks, conciliación de pagos y carreras por la
última unidad. Esta tarea debe proveer feedback público actual de stock y
validaciones de servidor sin afirmar que los carritos casuales reservan stock.

## Etapa 5: eventos y retiros

Los eventos y retiros son slices operativos posteriores. Agregá asignación
manual, venta contra asignación y liberación de unidades no usadas solo después
de probar el contrato de inventario compartido y el flujo de soporte local. Las
unidades asignadas quedan no disponibles para compra online hasta venderse o
liberarse, sin restar las mismas unidades dos veces.

Advertí a los operadores sobre eventos desconectados y registros manuales
obsoletos. Las operaciones de asignación, venta contra asignación y liberación
deben ser atómicas e idempotentes. Esta etapa no crea un segundo catálogo, no
agrega integración POS ni implementa sincronización offline.

## Límite de experiencia offline

La tienda física puede cachear o precargar páginas públicas del catálogo para
navegación de solo lectura y mostrar un timestamp de última actualización con
una advertencia explícita de datos desactualizados. El reconocimiento de
cámara, cambios de carrito, pagos, creación de ventas locales, mutaciones de
inventario y confirmaciones del personal requieren conexión activa. Los
borradores locales solo pueden guardarse como borradores no confirmados y nunca
presentarse como compras, reservas o movimientos de stock.

## Superficies principales de implementación

- `src/app/[locale]`, rutas de producto, carrito y checkout: conservar el
  contrato ecommerce existente y transportar la modalidad de fulfillment.
- `src/features/product` y UI compartida: elección retiro-versus-entrega,
  entrada de cámara, confirmación de candidatos, estados de permiso/error y
  alternativas accesibles.
- `src/lib/commerce`, `src/lib/checkout` y route handlers: conservar límites
  entre proveedores; transportar fulfillment sin usarlo para autorizar precios.
- Colecciones y hooks del CMS: registros de venta local, ledger de inventario,
  permisos y flujos posteriores de venta asistida permanecen privados y
  autorizados.
- Migraciones: backfill de inventario, ledger, idempotencia, rollback y
  conciliación sin cambiar IDs de ítems vendibles ni referencias de carritos.
- `messages/en.json` y `messages/es.json`: todas las modalidades, estados,
  errores y acciones de recuperación visibles para clientes mediante
  `next-intl`.
- Tests: validación de modalidad, idempotencia de venta local, estados de pago,
  efectos de stock exactamente una vez, permisos y fallas de cámara,
  confirmación de candidatos, carritos desactualizados, privacidad,
  autorización, concurrencia de inventario, conteos físicos, asignación de
  eventos y seguridad de migraciones.

## Decisiones y política pendiente

- Las Etapas 1 y 2 usan la página ecommerce y el checkout de pago existentes.
- La Etapa 1 no crea códigos QR por producto ni requiere escaneo QR.
- La Etapa 1 requiere elección explícita de retiro local o entrega y un registro
  privado de venta vinculado al pedido.
- Un pedido local pagado de la Etapa 1 afecta el inventario compartido solo
  después de la confirmación autoritativa del pago, exactamente una vez.
- El reconocimiento de cámara es una ayuda optativa para descubrir productos,
  con confirmación explícita y alternativas de texto/personal.
- Al principio el personal brinda asistencia técnica en vez de operar un
  checkout separado.
- Ningún flujo local otorga descuentos, saltea pagos ni expone inventario exacto.
- No se implementan confirmación offline, verificación de pagos ni sincronización
  de inventario offline.
- Las cancelaciones, devoluciones, reembolsos, no-shows y permisos de reversión
  deben definirse antes del despliegue productivo.
- Elegí y documentá el modelo de registros separados o registro unificado antes
  de implementar los esquemas de venta local e inventario.

## Orden de verificación

1. Probá el descubrimiento normal del webshop en EN/ES y completá los recorridos
   de retiro local y entrega en móvil y desktop.
2. Verificá la elección de modalidad, ausencia de envío, estado del pedido y
   creación exactamente una vez de la venta local ante reintentos, recargas y
   callbacks de pago.
3. Verificá que un pago pendiente/no verificado no cree efecto de stock y que
   una confirmación autoritativa cree solo uno.
4. Probá permiso de cámara, baja confianza, confirmación de candidato, falla de
   subida, timeout, falta de red y fallback de búsqueda de texto.
5. Probá asistencia del personal sin exponer secretos ni stock privado.
6. Ejercitá recepción, venta local/offline, devolución, daño, corrección,
   conteo físico, recuperación de carritos desactualizados, fallas de lectura de
   inventario y actualizaciones concurrentes.
7. Ejercitá asignación de eventos, venta contra asignación y liberación solo
   después de implementar la Etapa 4.
8. Ejecutá controles EN/ES responsive en desktop/mobile, teclado, lint, builds y
   migraciones sobre una base descartable.

## Fuera de alcance explícito para las etapas actuales

- Generar o imprimir un código QR para cada producto, estante o etiqueta.
- Un flujo de escaneo QR como entrada de la Etapa 1.
- Restricciones de acceso basadas solo en Wi-Fi local.
- Un segundo POS o checkout operado por personal en la Etapa 1.
- Depósitos separados, ledger de compras, conversión automática de granel,
  motores de empaquetado y sincronización offline.
