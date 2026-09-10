# 08 — Búsqueda, filtros y recomendaciones de productos

Estado: planificado. Depende de: 02, 03, 04.

## Prompt de implementación para Codex

Conectá las experiencias diseñadas de búsqueda/filtros y productos relacionados con datos reales del CMS. Seguí `docs/plans/ecommerce/README.md`; reutilizá controles de tienda y primitivas compartidas existentes en vez de reconstruirlos.

### Pedido de funcionalidad

Soportá búsqueda de nombres/descripciones públicos localizados, filtro por categoría, límites de precio en ARS, filtro por tags públicos, ordenamiento, chips removibles de filtros activos, limpiar todo y paginación. Mantené el estado de query compartible en URLs y estable al navegar EN/ES. Validá todas las entradas de query.

Definí semántica de filtros: OR dentro de categorías seleccionadas, OR dentro de tags seleccionados inicialmente, AND entre distintos grupos de filtros y búsqueda. La elegibilidad de precio debe coincidir con al menos una variante comprable dentro del rango pedido. Filtrá/ordená el catálogo elegible completo antes de paginar, no solo la página cargada. Cualquier limitación de un proveedor existente debe ser explícita, no simulada silenciosamente con filtrado parcial en cliente.

Proveé relaciones CMS para productos similares y productos complementarios, con orden editorial y fallback automático por categoría/tags. Los productos similares son alternativas; los complementarios completan un ritual. Excluí el mismo producto, duplicados, borradores e ítems no comprables de las recomendaciones de compra. Preservá páginas permitidas de productos discontinuados mientras sugerís alternativas comprables.

Los filtros mobile soportan un flujo accesible de selección borrador/aplicar, comportamiento cancelar/reabrir, conteo visible de activos y recuperación ante resultados vacíos. Los links de producto navegan al ítem seleccionado, no a un producto placeholder.

### Definición de terminado

- [ ] Categoría, precio, tags, búsqueda y ordenamiento se componen correctamente sobre el set completo de resultados con conteos/paginación precisos.
- [ ] Cambiar EN/ES conserva IDs estables de filtro y la ruta/query equivalente.
- [ ] Se prueban bordes de rango de precio de variante, límites malformados, resultados vacíos y tags ocultos.
- [ ] Los links relacionados abren páginas localizadas correctas de producto y respetan el orden editorial/exclusiones de fallback.
- [ ] Se verifican estados loading/error/vacío, operación por teclado, aplicar/cancelar filtros mobile y retorno de foco.
- [ ] Los resultados de búsqueda públicos no pueden exponer proveedor, costo ni notas internas.
- [ ] Adaptadores de proveedor, documentación y checks compartidos están completos.

### Fuera de alcance

Motores de recomendación personalizada, servicios externos de búsqueda y precios con descuento específicos de campaña (integrados por la tarea 09).
