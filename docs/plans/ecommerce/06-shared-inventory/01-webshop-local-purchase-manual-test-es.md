# Verificación manual de PMG-360

Estado: implementación parcial; creación de pedido y venta local lista para aceptación manual.

## Alcance de esta guía

Esta guía verifica la selección y persistencia de la modalidad, la creación
idempotente del pedido ecommerce y el vínculo con una venta local. No certifica
la conciliación autoritativa de pagos, callbacks duplicados ni efectos de stock,
que continúan pendientes dentro de PMG-360 y su límite con la Tarea 07.

## Preparación

1. Usá una base PostgreSQL descartable, nunca producción.
2. Aplicá las migraciones hasta
   `20260912_122450_task_06_1_order_local_sale`.
3. Configurá el storefront con Payload como proveedor de comercio y una API key
   de prueba autorizada para crear y consultar pedidos.
4. Configurá Mercado Pago únicamente con credenciales de prueba.
5. Creá un producto simple y otro con una variante publicada. Ambos deben tener
   SKU, precio ARS, stock y contenido localizado en ES/EN.
6. Anotá el commit, IDs de producto/variante y SKU. No registres API keys,
   cookies, tokens ni datos personales reales en la evidencia.

Repetí los recorridos de interfaz en ES y EN, a 1440 px y 390 px. Verificá Tab,
Shift+Tab, barra espaciadora y Enter sobre las opciones de modalidad.

## Casos principales

| Caso                      | Pasos                                                                                                                            | Resultado esperado                                                                                                                                                               |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modalidad obligatoria     | Agregá un producto al carrito e intentá continuar sin elegir modalidad.                                                          | El botón permanece deshabilitado o el checkout responde 400 con un mensaje localizado. No se crea un pedido.                                                                     |
| Retiro local              | Elegí retiro local, recargá, cambiá de idioma y continuá al checkout.                                                            | La elección persiste. Se crea un pedido ecommerce y exactamente una venta local vinculada. El identificador externo del pago corresponde al pedido.                              |
| Entrega                   | Elegí entrega, recargá y continuá al checkout.                                                                                   | La elección persiste y se crea un pedido ecommerce. No se crea una venta local. Los requisitos de dirección deben verificarse cuando se implemente el flujo completo de entrega. |
| Cambio de modalidad       | Elegí retiro, cambiá a entrega y después volvé a retiro antes de pagar.                                                          | El carrito conserva solo la última elección. El pedido y la venta local registran retiro local.                                                                                  |
| Reintento de checkout     | Iniciá el checkout dos veces desde el mismo carrito, incluida una recarga o reintento después de un error del proveedor de pago. | Ambas solicitudes reutilizan el mismo pedido mediante `checkoutKey`. Existe una sola venta local para ese pedido.                                                                |
| Producto simple           | Comprá el producto simple con retiro local.                                                                                      | El snapshot contiene ID de producto, SKU, título localizado, cantidad, precio unitario, moneda y total; no inventa una variante.                                                 |
| Variante                  | Comprá la variante con retiro local.                                                                                             | El pedido referencia producto y variante exactos. El snapshot conserva SKU, título localizado y todas las opciones seleccionadas.                                                |
| Carrito con varias líneas | Agregá un producto simple y una variante, con cantidades diferentes.                                                             | El pedido contiene ambas líneas y el snapshot conserva identidad, cantidades e importes de cada una. El total coincide con el carrito confirmado.                                |
| Shopify con entrega       | Con Shopify configurado, elegí entrega e iniciá checkout.                                                                        | Continúa hacia el checkout nativo de Shopify sin intentar crear un pedido Payload.                                                                                               |
| Shopify con retiro        | Con Shopify configurado, elegí retiro local e iniciá checkout.                                                                   | Falla de forma cerrada con un mensaje explícito; no simula una venta local sin pedido Payload.                                                                                   |

## Verificación en el CMS

Después de cada caso exitoso con Payload:

- [ ] El pedido tiene `checkoutKey`, `cartReference`, `fulfillmentMode` y
      `commercialSnapshot`.
- [ ] Los importes del pedido están guardados en centavos y el snapshot conserva
      importes decimales con código de moneda.
- [ ] Retiro local genera una sola entrada en Ventas locales con relación al pedido.
- [ ] Entrega no genera una entrada en Ventas locales.
- [ ] La clave de venta local es `local-sale:<id-del-pedido>` y permanece única.
- [ ] Pedido y venta local conservan el mismo snapshot comercial.
- [ ] Los campos de identidad, modalidad, comprador, snapshot y pago de la venta
      local están deshabilitados para edición, incluso para administración.
- [ ] Ninguna respuesta pública expone stock exacto, reservas, costos de compra,
      datos de proveedor ni notas operativas.

## Fallas y recuperación

- [ ] Quitá temporalmente las credenciales de Mercado Pago después de crear el
      carrito. El checkout falla sin crear pedidos duplicados al reintentarlo.
- [ ] Quitá la API key del CMS. La creación del pedido falla de forma cerrada y
      no se inicia una preferencia de pago sin pedido.
- [ ] Modificá el precio o discontinuá la variante antes de continuar. El flujo
      conserva las líneas accionables y no crea un pedido con datos obsoletos.
- [ ] Enviá dos solicitudes simultáneas para el mismo carrito. El índice único
      debe impedir dos pedidos; al terminar debe existir un único vínculo local.
- [ ] Intentá crear manualmente un pedido sin `checkoutKey`, `cartReference`,
      `fulfillmentMode` o `commercialSnapshot`. El CMS debe rechazarlo.

No marques como aprobados los callbacks duplicados, pagos tardíos, conciliación
ni mutaciones de inventario con esta guía: todavía requieren la implementación
autoritativa de pago y stock.

## Evidencia automática

Ejecutá desde la raíz:

```powershell
node --import ./tests/register.mjs --test tests/local-purchase.test.mjs
npm run lint
npm run lint:cms
npm run build
npm run build:cms
```

Registrá por caso: fecha, commit, proveedor, idioma, ancho, IDs descartables,
resultado real, aprobado/fallido/bloqueado y evidencia sin secretos. Las pruebas
automatizadas no reemplazan la inspección de los registros persistidos.
