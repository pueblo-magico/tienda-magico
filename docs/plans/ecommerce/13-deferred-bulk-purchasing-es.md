# 13 — Diferido: reempaquetado a granel e historial de compras

Estado: diferido. Depende de: 05, 06, 07. Ejecutar solo después de priorización explícita.

## Prompt de implementación para Codex

Después de aprobación explícita, extendé la funcionalidad privada existente de compras/inventario para soportar stock a granel y reempaquetado auditable. Seguí `docs/plans/ecommerce/README.md`.

### Pedido de funcionalidad

Agregá recibos de compra con proveedor, importe/moneda original, cantidades/unidades, fecha y referencias privadas. Preservá costos originales; cualquier conversión de reporte guarda tasa/fuente/fecha sin reescribir historia. No reemplaces la entrada simple existente de costo unitario hasta que su migración y propiedad derivada/manual estén claras.

Representá materiales a granel y packaging como ítems de stock que no aparecen en storefront. Las recetas de conversión describen inputs y outputs terminados esperados, pero no crean stock por sí mismas. Una operación confirmada descuenta atómicamente inputs medidos, registra packaging/merma y agrega cantidades terminadas medidas. Soportá distintos outputs desde el mismo input a granel. Usá idempotencia y entradas de reversión, no ediciones silenciosas de historial.

Evaluá lotes/vencimiento solo con requisitos de negocio explícitos. No infieras que un kilogramo disponible de cacao equivale a diez bolsas listas para despachar. Protegé operaciones contra el uso concurrente del mismo stock a granel.

### Definición de terminado

- [ ] Los recibos preservan moneda/base de costo original y permanecen privados.
- [ ] El reempaquetado conserva material medido sujeto a merma registrada explícitamente y conversión de unidades.
- [ ] Un input de 1.000 g puede producir cinco bolsas de 100 g y una de 500 g, con packaging registrado cuando esté configurado.
- [ ] Stock insuficiente a granel/de packaging falla atómicamente; operaciones duplicadas no duplican outputs.
- [ ] Se prueban reversiones, conversiones concurrentes, cantidades fraccionarias y unidades no coincidentes.
- [ ] Solo el stock terminado impulsa disponibilidad en storefront; los datos históricos simples de costo/stock siguen compatibles.
- [ ] Documentación operativa, migraciones y verificación compartida están completas.

### Fuera de alcance

Contabilidad completa, procesamiento de pagos a proveedores, planificación de manufactura y seguimiento regulatorio por lote salvo aprobación separada.
