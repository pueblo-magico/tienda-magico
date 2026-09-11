# Artículos vendibles — PMG-221

## Edición

El editor puede guardar un borrador de variante sin opciones completas mientras
lo completás. Ese borrador todavía no tiene una combinación vendible: para publicar
necesitás un valor por tipo, SKU y precio ARS válido. Una combinación ya asignada
no se puede vaciar ni redefinir, aunque guardes como borrador.

Los tipos de opción se toman siempre del producto: no se infieren de los valores
seleccionados. Los borradores de variantes usan la última configuración editorial;
al publicar una variante se consulta el producto sin superponer cambios en borrador,
igual que en el carrito. Activá las variantes y guardá los tipos antes de completarlas.
Si el producto ya está publicado, sus cambios de configuración deben publicarse
primero. Para convertir un producto simple sin variantes publicadas, despublicalo,
guardá la configuración, publicá las variantes y volvé a publicar el producto;
durante esa preparación no estará disponible para comprar. Un producto nuevo
puede permanecer en borrador mientras publicás sus primeras variantes.

El precio regular sigue siendo `priceInARS` del plugin, en centavos enteros positivos
(125050 representa ARS 1.250,50). Activá ARS antes de publicar. No se permiten
artículos gratuitos ni precios alternativos en otras monedas. El idioma no cambia
la moneda. Un producto simple edita su propio artículo; un producto con variantes
edita SKU, precio y stock en cada variante.

El SKU se normaliza a mayúsculas y queda estable una vez asignado. Los índices
únicos y el trigger PostgreSQL impiden reutilizarlo entre productos y variantes.
Los registros existentes reciben `PM-P-<id>` o `PM-V-<id>`; revisalos antes del
despliegue si necesitás conservar códigos de otro sistema. No cambian los IDs,
slugs, importes ni relaciones de los carritos. Las combinaciones usan IDs de tipos
y valores, requieren exactamente un valor por tipo y no se pueden redefinir:
creá otra variante y discontinuá la anterior.

El campo SKU usa los datos guardados para quedar en solo lectura: un registro
existente sin SKU permite escribirlo completo antes de guardar. Conserva etiqueta,
ayuda, errores y restricciones de permisos del campo estándar de Payload. La API
rechaza cambios o borrados del SKU asignado incluso al activar variantes.

Traducí las etiquetas de tipos y valores en ES y EN. Sus códigos y relaciones
siguen compartidos. La migración copia cada etiqueta anterior a ambos idiomas;
la traducción editorial posterior puede cambiar cada copia.

El contenido neto admite gramos (`g`), mililitros (`ml`) o unidades (`unit`).
Completá cantidad positiva y unidad juntas. La unidad de venta es unidad o paquete;
no representa la unidad de compra al proveedor. El peso embalado se guarda en gramos
y las dimensiones en milímetros, siempre no negativos. Estos datos de preparación
son privados para administradores y no se proyectan al storefront.

Una pieza única permite stock máximo de uno, sin backorders. La UI limita la
cantidad a uno; el CMS verifica cantidades acumuladas en todas las líneas de ese
artículo. Esta validación no reserva stock entre carritos: eso pertenece a la tarea 07.

## Storefront y carrito

Cambiar una opción actualiza precio, imagen, contenido neto y límite de cantidad.
La imagen de variante tiene prioridad y el producto aporta el fallback. Las
combinaciones inválidas, discontinuadas, sin precio y agotadas no habilitan compra.
Las tarjetas usan el mínimo de los artículos comprables; sin artículos elegibles
muestran el estado localizado de producto no disponible.

El carrito conserva identidad y opciones y consulta precios actuales sin caché.
Agregar un artículo o confirmar precios registra el precio unitario del servidor;
la lectura compara ese importe con el catálogo para detectar cambios incluso
cuando dos cambios se compensan en el total. Los carritos anteriores sin snapshot
requieren una confirmación explícita de precios. No se pueden
reconstruir precios históricos individuales que nunca fueron guardados.

Un cambio de precio muestra una confirmación explícita de los precios actuales.
Cambiar cantidades o quitar otra línea no acepta el cambio de precio.
Una línea discontinuada o sin precio queda visible para quitarla.
Checkout rechaza líneas pendientes de revisión y cantidades inválidas con un
mensaje localizado. La identidad del artículo y ARS se conservan en Mercado Pago.
Un error de red conserva la selección y la referencia del carrito para reintentar.

## Revalidación

Productos, variantes y etiquetas de opciones notifican el endpoint existente de
revalidación al guardar/eliminar. Se invalidan `products` y `payload-products`, que
usan listados, detalle, relacionados y bloques destacados. Los medios usan el
mismo mecanismo. Configurá `STOREFRONT_REVALIDATION_URL` y el secreto compartido
según la documentación existente. Si falta configuración o falla la notificación,
permanece el fallback de caché de 60 segundos y puede requerirse otra visita tras
la actualización en segundo plano. Una pestaña ya abierta debe recargarse para
recibir cambios editoriales. Las mutaciones y la lectura del carrito no usan esa caché.

## Migración y rollback

### Alineación del esquema (PMG-358)

El hook `sellableSchema` define el índice único parcial de `combinationKey`:
solo participan variantes sin `deletedAt` y con una combinación asignada. El campo
Payload no declara unicidad global. Así, la generación de migraciones y el esquema
de desarrollo comparten la misma regla. El estado comercial discontinuado no
libera la combinación; enviarla a la papelera sí. Restaurarla falla si otra variante
no eliminada ya ocupa esa combinación; no se fusionan ni cambian identidades.

Autosave permanece desactivado en productos y variantes. El hook conserva las
columnas históricas `autosave` de ambas tablas de versiones, sin exponerlas como
campos ni reactivar guardados automáticos. La migración de alineación retira sus
índices y el índice de combinación en versiones, pero no elimina columnas ni historial.

La migración `20260911_142004_task_04_schema_alignment` incluye un snapshot generado
con Payload. Su rollback restaura los índices secundarios y conserva la unicidad
parcial, porque ya existía en la migración anterior. El generador no conocía esa
migración SQL sin snapshot: por eso el rollback se ajustó al estado real anterior.
No sustituyas ese rollback por el índice global sugerido por el snapshot viejo.

Retroceder además `20260911_001000_task_04_active_combination_index` intenta volver
a la unicidad global y falla si hay combinaciones reutilizadas en la papelera.
Ejecutá siempre cada migración dentro de una transacción: ante el conflicto se
conserva el índice parcial. Antes de ese rollback, exportá y conciliá los registros
conflictivos con aprobación; nunca borres historial automáticamente para hacerlo pasar.
Desplegá la configuración y las migraciones juntas, con respaldo previo. No ejecutes
schema push sobre la base habitual para reemplazar el despliegue por migraciones.

Verificación aislada: desde `apps/cms`, ejecutá
`node --import tsx scripts/test-task-04.mjs`. Usa la conexión local de `.env.local`
para crear una base nueva y elimina únicamente esa base al finalizar. Compara el
snapshot con el esquema, verifica reutilización y restauración conflictiva, y
ejercita rollback/reaplicación sin tocar registros de la base habitual.

Aplicá las migraciones registradas en una copia descartable de la base y respaldá
los datos antes de desplegar. La migración de esquema convierte los antiguos
campos varchar de icono/ciclo de vida a sus enums sin borrar contenido. Las
etiquetas se copian antes de eliminar las columnas antiguas. El backfill de
combinaciones falla ante duplicados: conciliá esos registros explícitamente;
no se elimina ni se fusiona una variante automáticamente.

`node apps/cms/scripts/reconcile-task-04-migration.mjs` reproduce los ajustes de
compatibilidad sobre la salida del generador, conserva el orden histórico requerido
por las migraciones ARS y registra el backfill. Ejecutalo después de regenerar
las migraciones de esta tarea. Los snapshots y tipos se generan con Payload.

El rollback de identidades elimina los triggers, pero conserva códigos asignados.
El rollback de etiquetas conserva la etiqueta española, con fallback a otro idioma;
se pierde la traducción adicional. El rollback del esquema elimina los campos
comerciales nuevos y sus versiones, y conserva los campos de la tarea 03. Exportá
primero SKU, medidas, imágenes y traducciones nuevas. Nunca ejecutes un rollback
destructivo en datos reales sin respaldo y aprobación.

## Verificación

Ejecutá `npm run test:task-04`, los builds y lint de ambas aplicaciones, y el
chequeo de formato de los archivos modificados. La checklist de aceptación está
en `docs/plans/ecommerce/04-sellable-items-pricing-manual-test.md`. La implementación
no se considera aceptada hasta verificar migraciones y el flujo real CMS → tienda.

Para probar persistencia y migraciones, ejecutá
`node apps/cms/node_modules/tsx/dist/cli.mjs apps/cms/scripts/test-task-04.mjs`.
Requiere `DATABASE_URL` en `apps/cms/.env.local`, PostgreSQL local y permiso para
crear bases. Crea y elimina únicamente una base descartable `pmg221_test_<timestamp>`;
no aplica migraciones ni crea artículos en la base configurada. Verifica la cadena
completa, reglas comerciales, confirmación de precios y rollback/reaplicación.
