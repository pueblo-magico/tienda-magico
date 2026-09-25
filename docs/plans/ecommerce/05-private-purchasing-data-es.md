# 05 — Información privada de proveedores, costos y acuerdos comerciales

## Alcance implementado por TIENDA-25

El CMS incorpora proveedores privados y separa explícitamente la **Marca** pública
del **Proveedor** operativo. Cada proveedor define términos comerciales
predeterminados de compra o consignación. Un producto puede heredarlos o guardar
una excepción específica, con método porcentual en puntos básicos o importe fijo
en unidades monetarias menores, moneda y período de vigencia.

Los roles `purchasing`, `finance` y `admin` pueden consultar y editar esta
información. Clientes, visitantes y otros roles no la reciben por REST, GraphQL,
Local API ni población pública del producto. La venta, liquidación y pago al
proveedor se implementan por separado en TIENDA-34 y TIENDA-35; esta tarea solo
establece la fuente contractual privada y versionada.

La migración descendente reasigna los roles `purchasing` y `finance` a `admin`
antes de retirar esos valores. Esto evita cuentas inválidas, pero es una pérdida
deliberada de granularidad y debe revisarse antes de un rollback productivo.

Estado: planificado. Depende de: 01, 04.

## Prompt de implementación para Codex

Implementá una funcionalidad de información de compras deliberadamente pequeña y segura. Seguí `docs/plans/ecommerce/README.md`.

### Pedido de funcionalidad

Agregá registros privados de Proveedores con nombre, país, información de contacto opcional, referencia del proveedor y notas internas. Proveedor no es Marca y país del proveedor no es origen del producto.

Adjuntá datos operativos privados al ítem vendible: proveedor opcional, SKU del proveedor, monto/moneda de costo unitario (incluido BRL), cantidad/unidad de base de costo, fecha de última actualización de costo y notas internas. Identificá claramente si el costo compra una unidad minorista terminada o una cantidad a granel; no calcules silenciosamente una a partir de la otra. Guardá dinero sin errores de punto flotante. No calcules márgenes restando BRL de ARS.

Implementá permisos de mínimo privilegio para compras/finanzas frente a personal de catálogo/inventario, compatibles con usuarios/roles admin existentes. Mantené datos privados en registros restringidos o campos protegidos detrás de un límite explícito. Ofrecé acceso cómodo en CMS para usuarios autorizados sin exponerlo a través de población de productos.

Auditá REST/GraphQL directos, llamadas Local API, mapeos de adaptadores, respuestas públicas de producto/búsqueda/carrito, exportaciones, logs y cachés para evitar filtraciones. Ocultar campos en admin no es seguridad. Usá solo información dummy de proveedores para pruebas.

### UI requerida de CMS e implicancias para el storefront

- Los usuarios autorizados de compras/finanzas necesitan un flujo completo en CMS para crear/seleccionar un proveedor y ver/editar costos de ítems, moneda, base, fecha de actualización y notas desde el flujo de ítem vendible. Mostrá validación, feedback de guardado, datos opcionales faltantes y estados de acceso denegado. Dejale clara la diferencia entre costo de compra y precio público de venta en ARS; no requieras llamadas API crudas para operaciones rutinarias.
- Los usuarios de catálogo/inventario sin permiso de compras deben conservar sus flujos permitidos de producto y stock sin recibir valores de campos privados ni registros de proveedor en payloads del cliente admin. Aplicá esto en el servidor además de la UI.
- Cards/listados públicos de producto, detalle de producto, bloques CMS de productos, drawer/página de carrito y checkout deben seguir renderizando solo datos comerciales permitidos. Identidad del proveedor, SKU del proveedor, contactos, costos/monedas, base de costo, fechas y notas internas no tienen representación visible para clientes. Marca pública y origen siguen siendo sus fuentes editoriales separadas.
- Una edición de proveedor/costo no debe cambiar precios públicos en ARS, rangos de precio, formato de moneda, origen/Marca del producto, elegibilidad de compra ni totales de carrito. Los registros de compras opcionales o inaccesibles no deben romper el render del catálogo ni el checkout. Ningún componente público debe necesitar acceso privilegiado de compras.
- Verificá HTML renderizado, payloads cliente/RSC, metadata/datos estructurados donde existan, respuestas de red del navegador y cachés públicas, además de tipos de adaptador y APIs directas. Redactar solo el texto visible no alcanza. Implementá cualquier fix necesario de mapeo o UI del storefront dentro de esta tarea.

### Flujo de aceptación humana

Con datos dummy, hacé que un usuario autorizado cree un proveedor y guarde un costo en BRL con base explícita para un ítem vendible en ARS desde la UI del CMS. Confirmá persistencia después de recargar y validación útil para valores inválidos de costo/base. Repetí como usuario de catálogo/inventario y verificá que el acceso privado se deniega mientras la edición permitida sigue funcionando. Navegá listado/detalle, agregá el ítem al carrito y entrá al checkout existente de forma anónima y como cliente en EN/ES. Cambiá los datos privados y repetí: los precios/contenido públicos deben permanecer sin cambios y los valores privados dummy deben estar ausentes del output renderizado y de los payloads de red. Repetí sin registro de proveedor/costo. Registrá controles responsive/de teclado de CMS y storefront, y evidencia de permisos/filtraciones en una checklist manual junto a esta tarea.

### Definición de terminado

- [ ] El personal autorizado puede editar costos en BRL para productos vendidos en ARS, con base de costo y fecha explícitas.
- [ ] Editores de catálogo y clientes comunes no pueden leer/escribir campos privados de compras salvo que se les otorgue permiso explícito.
- [ ] Las llamadas API anónimas, relaciones pobladas de producto y respuestas del storefront no contienen costos, contactos de proveedor ni notas.
- [ ] Los tipos públicos de producto no pueden serializar accidentalmente registros operativos privados.
- [ ] Las pruebas de permisos cubren anónimo, cliente, editor, finanzas y admin; las escrituras denegadas dejan los datos sin cambios.
- [ ] La validación de costo/moneda, migración de roles, artefactos generados y documentación operativa están completos.
- [ ] El personal autorizado completa el flujo proveedor/costo desde pantallas CMS usables, incluida validación y acceso denegado; CRUD solo por API no alcanza.
- [ ] Los flujos reales de listado/detalle/carrito/checkout del storefront siguen funcionando con datos de compras faltantes o restringidos, y las ediciones privadas no alteran precios públicos, moneda, Marca ni origen.
- [ ] Los controles EN/ES desktop/mobile y teclado, más los controles de filtración renderizada/de red, quedan registrados para el flujo de aceptación humana. La finalización cubre el flujo privado completo y su límite público.

### Fuera de alcance

Órdenes de compra, contabilidad de costo puesto, conversión automática de moneda, dashboards de rentabilidad y cargas privadas de documentos.
