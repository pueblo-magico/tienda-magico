# 09 — Ofertas programadas, cupones y presentación de campañas

Estado: planificado. Depende de: 04, 07, 08.

## Prompt de implementación para Codex

Implementá una única ruta autoritativa de evaluación de promociones compartida por visualización de catálogo, carrito y checkout. Seguí `docs/plans/ecommerce/README.md`.

### Pedido de funcionalidad

Los precios regulares en ARS permanecen en los ítems vendibles. Las promociones tienen activación automática/cupón, reducción porcentual/fija/precio promocional fijo, productos/variantes/categorías/tags elegibles, instantes de inicio/fin, estado habilitado, gasto/cantidad mínima opcional, prioridad y límites de uso. Sin acumulación por defecto; documentá la selección determinística de la mejor oferta elegible y desempates. Validá importes acotados e impedí totales negativos.

Las campañas tienen título/copy localizado, banner, slug compartido opcional, productos destacados y promociones vinculadas. La visibilidad de campaña no otorga por sí misma un descuento. Proveé una acción cómoda para crear oferta desde el editor de producto sin crear campos de precio de oferta en competencia.

Devolvé precio regular/efectivo resuelto, ahorro en la misma moneda y etiqueta de oferta elegible mediante contratos de comercio. Las ofertas solo por cupón y específicas de cliente no son precios públicos universales de oferta. Preservá historial de precios para precios de referencia legítimos; no inventes importes compare-at. Manejá con honestidad precios distintos de variantes y presentación "desde".

Reevaluá en servidor en carrito/checkout, invalidá cachés relevantes en límites programados y registrá asignaciones inmutables de descuento en líneas de orden. Definí redondeo entero, asignación de descuentos fijos entre líneas, base de gasto mínimo, tratamiento de envío/impuestos, reserva/liberación de uso y comportamiento de pago tardío antes de habilitar ofertas. No permitas que checkouts simultáneos excedan límites de uso. Adaptá importes de Mercado Pago para que igualen el total de orden aceptado.

### Definición de terminado

- [ ] Las ofertas automáticas programadas muestran precios regulares/reducidos y ahorros consistentes en listado, detalle, carrito y checkout.
- [ ] Los cupones se normalizan, validan en servidor, limitan por tasa cuando corresponda y dan feedback localizado sin exponer reglas privadas de segmentación.
- [ ] Se prueban límites de inicio/fin, reglas superpuestas, expiración durante checkout, códigos inválidos, límites y redención concurrente.
- [ ] La asignación/redondeo de descuentos produce totales ARS exactos y soporta reembolsos parciales sin cambiar precios históricos.
- [ ] El filtrado/ordenamiento de precios de la tarea 08 sigue una política documentada de precio efectivo, excluyendo precios no disponibles solo por cupón.
- [ ] El copy/medio de campaña soporta EN/ES; deshabilitar una campaña no altera accidentalmente promociones no relacionadas.
- [ ] Las APIs y cachés de promociones no divulgan datos privados de cupón o elegibilidad de cliente.
- [ ] Totales de pago sandbox, migración, guía operativa y verificación compartida están completos.

### Fuera de alcance

Buy-X-get-Y, bundles, puntos de fidelidad, suscripciones, tipos de cambio en vivo y acumulación compleja de promociones.
