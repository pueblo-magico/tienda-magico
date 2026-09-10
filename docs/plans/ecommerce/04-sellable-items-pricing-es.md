# 04 — Ítems vendibles, variantes, precios en ARS y datos de preparación

Estado: planificado. Depende de: 01, 02.

## Prompt de implementación para Codex

Implementá la edición comercial de productos/variantes y la selección en el storefront usando el modelo de propiedad establecido en la tarea 01. Seguí `docs/plans/ecommerce/README.md`.

### Pedido de funcionalidad

Cada ítem vendible tiene su propio SKU único y estable, código de barras opcional, relaciones estables de opción/valor, precio regular en ARS, estado activo/discontinuado, medios opcionales específicos de variante, cantidad/unidad de contenido neto, unidad de venta, peso embalado para envío, dimensiones del paquete y política de pieza única. El contenido compartido permanece en el producto. Soportá variantes de 100 g y 500 g con precios e identidades de inventario independientes.

Guardá los valores de medición en unidades canónicas documentadas y formateá los valores visibles para clientes según el locale. Distinguí contenido neto de peso embalado para envío, y unidad de venta minorista de unidad de compra a proveedor. Validá mediciones no negativas y cantidades vendibles positivas. Definí explícitamente el comportamiento de precio cero en vez de permitir ítems gratis por accidente.

Usá la fuente de precios ARS existente del plugin y validá unidades menores enteras; adaptalo de forma segura a los contratos `Money` existentes. No agregues una tabla paralela de precios ni checkout multi-moneda. Un precio faltante/inválido no debe convertirse en cero ni en un fallback comprable. El rango de precios del producto se deriva de variantes elegibles, no se edita manualmente.

Los selectores de variantes muestran etiquetas localizadas, medios específicos de variante con fallback al producto, precio correcto y comprabilidad. Los identificadores del carrito siguen mapeando al ítem vendible exacto. Los saldos exactos internos de stock no deben exponerse nuevamente a clientes públicos; ofrecé disponibilidad y un límite seguro de compra cuando haga falta.

### Representación requerida en el storefront

- Detalle de producto (`/[locale]/shop/[handle]`): implementá selectores accesibles para las opciones vendibles reales, etiquetas localizadas de opciones, precio ARS seleccionado, medios de variante con fallback al producto y contenido neto/unidad de venta pública. Un producto simple usa el mismo contrato de compra sin selector innecesario. Mantené las mediciones de embalaje para envío en la lógica de preparación salvo que exista una explicación de envío visible al cliente que las necesite; nunca etiquetes peso embalado como contenido neto.
- Controles de selección y compra: cambiar una opción actualiza precio, medios, disponibilidad y restricciones de cantidad en conjunto. Las combinaciones sin precio, inactivas/discontinuadas y no disponibles muestran una explicación localizada y no pueden agregarse. Aplicá el límite de pieza única en la UI y en la validación del servidor. Manejá opciones faltantes, pedidos pendientes y agregados fallidos sin perder la selección válida del cliente.
- Cards y listados, incluidos bloques CMS de productos destacados y cards existentes de productos relacionados: consumen el precio o rango de precios autoritativo de ítems elegibles en ARS y una elegibilidad de compra consistente. No anuncies el precio de una variante no disponible como precio inicial comprable. Definí explícitamente el estado sin ítems elegibles.
- Drawer y página de carrito: muestran la variante/opciones exactas seleccionadas, cantidad, fallback de imagen, precio unitario ARS y totales. Preservá la identidad del ítem entre recargas y cambios de idioma. Mostrá un precio modificado o una selección inválida/discontinuada con feedback localizado y accionable; nunca sustituyas silenciosamente otra variante.
- Handoff de checkout existente: preservá identidad del ítem seleccionado, cantidades y precios ARS a través de `@/lib/checkout`. Actualizá la UI de checkout existente para fallas de validación comercial introducidas acá. La tarea 07 se ocupa del ciclo de reserva/pago, pero el flujo actual selección-carrito-checkout debe funcionar cuando esta tarea esté completa.
- Documentá la política de refresh/revalidación de caché para que ediciones de precio, opción, medios y ciclo de vida en CMS lleguen a todas las superficies afectadas del storefront. Reutilizá controles UI canónicos y actualizá `/ui-system` para variantes/estados compartidos modificados.

### Flujo de aceptación humana

Creá un ítem simple y un producto con variantes de 100 g/500 g, SKUs, precios y medios distintos. En EN y ES, compará precios de listado, seleccioná cada tamaño, agregalo al carrito, cambiá la cantidad, recargá, cambiá el idioma y entrá al flujo de checkout existente. Editá un precio y discontinuá una variante en CMS; después verificá las actualizaciones renderizadas y la recuperación de carrito desactualizado según la política de refresh documentada. Repetí con un ítem sin precio, medios faltantes de variante, un ítem de pieza única y un pedido de carrito fallido. Registrá resultados desktop/mobile y de teclado en una checklist manual junto a esta tarea; diferenciá controles ejecutados de verificaciones pendientes.

### Definición de terminado

- [ ] La edición de ítems simples y multi-variante usa una única ruta autoritativa de SKU/precio.
- [ ] Se rechazan SKUs/combinaciones de opciones duplicadas y valores inválidos de dinero/medición.
- [ ] El cambio de tamaño seleccionado cambia precio/medios y agrega la variante correcta al carrito en EN y ES.
- [ ] ARS persiste a través de cambios de idioma, carrito y mapeo de pago.
- [ ] Las variantes discontinuadas, sin precio y no disponibles no pueden comprarse.
- [ ] Los ítems de pieza única tienen cantidad máxima uno y no pueden habilitar backorders; la tarea 07 entrega la aplicación de concurrencia de stock.
- [ ] IDs/precios/referencias de carrito existentes sobreviven a la migración o tienen remapeo verificado.
- [ ] Las ediciones del CMS se verifican a través de persistencia, contrato público, cards/listados, selectores de detalle, drawer/página de carrito y UI de checkout existente usando la política de refresh documentada.
- [ ] El flujo de aceptación humana pasa en EN/ES en anchos desktop/mobile con acceso por teclado y estados loading/error/no disponible; la evidencia queda registrada. Los campos backend o pruebas de mapeo por sí solos no completan esta funcionalidad.
- [ ] Las pruebas compartidas, builds, documentación y controles responsive de teclado están completos.

### Fuera de alcance

Campos de precio promocional, tipos de cambio en vivo, historial de compras a proveedores y reempaquetado automático.
