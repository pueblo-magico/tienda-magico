# Tarea 06.2: descubrimiento de productos mediante cámara

> JIRA: PMG-361

## Alcance

Agregá una experiencia optativa de cámara al webshop después de estabilizar el
flujo de compra local. El reconocimiento visual ayuda a encontrar un producto;
no decide el producto, variante, precio, modalidad de fulfillment ni compra.

## Requisitos funcionales

- Pedir permiso para la cámara solo después de que la persona elija escanear.
- Capturar localmente cuando sea posible y explicar cuándo se requiere una subida.
- Enviar solicitudes de reconocimiento mediante un límite del lado servidor o proveedor aprobado.
- Nunca exponer credenciales del proveedor en el código del navegador.
- Devolver productos candidatos ordenados, con confianza y etiquetas visibles.
- Exigir confirmación explícita del candidato antes de abrir una página de producto.
- Conservar la navegación normal del webshop después de confirmar.
- Exigir que la persona elija retiro local o entrega por separado.
- Ofrecer búsqueda de texto y asistencia del personal cuando el reconocimiento no esté disponible o sea incierto.
- Soportar permiso denegado, cámara no disponible, offline, timeout, falla de subida y baja confianza.
- No usar reconocimiento facial ni inferir la identidad de la persona.
- No retener imágenes ni resultados sin una política de retención aprobada.

## Requisitos de límite

La salida del reconocimiento es una entrada de descubrimiento no confiable. Debe
resolverse contra el catálogo autoritativo antes de navegar y nunca puede saltear
la validación de producto, variante, precio, disponibilidad, checkout o
inventario. Tampoco debe exponer datos de compras de la Tarea 05 ni detalles de
inventario privado.

## Definición de terminado

- [ ] Los navegadores móviles soportados tienen estados accesibles de permiso y falla de cámara.
- [ ] Los candidatos muestran confianza y requieren confirmación explícita.
- [ ] Un resultado incierto nunca agrega automáticamente un ítem al carrito.
- [ ] Los resultados confirmados abren la página localizada canónica del producto.
- [ ] Retiro local versus entrega sigue siendo una elección explícita de la persona.
- [ ] La búsqueda de texto y la asistencia del personal funcionan cuando falla el reconocimiento.
- [ ] Las credenciales del proveedor, datos privados e imágenes innecesarias no se filtran ni retienen.
- [ ] Se registran controles EN/ES en desktop/móvil, teclado, privacidad, timeout, offline y baja confianza.
