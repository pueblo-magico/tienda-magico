# Verificación de PMG-221

Estado: implementación en revisión; aceptación integrada pendiente.

## Evidencia automática

Las referencias a builds, migraciones e integración de esta sección son históricas;
no certifican los cambios posteriores del hito 1. Su aceptación manual sigue pendiente.

- Las pruebas de catálogo, publicación, revalidación y reglas comerciales pasan.
- Build de CMS y storefront: ejecutados correctamente durante la implementación.
- Lint CMS: mantiene los dos errores previos de enlaces en `src/app/(frontend)/page.tsx`.
- La cadena completa de migraciones pasa en PostgreSQL local descartable. El
  rollback/reaplicación de la tarea conserva IDs, precios y relaciones del carrito.
- La integración con Payload verifica publicación, etiquetas EN/ES, privacidad,
  stock, SKU duplicado y aceptación explícita de precios. No modifica la base habitual.
- La aceptación visual CMS → tienda y el checkout con credenciales de prueba
  siguen pendientes; las pruebas de persistencia no reemplazan ese recorrido.

## Pruebas pendientes

### Hito 1 — Configuración de variantes

Estado: pendiente de ejecución manual. Las pruebas unitarias simulan Payload;
no verifican su persistencia ni la selección real de versiones en la base.

Preparación:

1. Usá CMS y storefront locales con una base descartable, nunca producción.
2. Creá los tipos Tamaño/Size y Envase/Packaging, con valores 100 g, 500 g
   y Bolsa/Bag. Anotá sus IDs y los IDs del producto y las variantes.
3. Prepará un producto nuevo con nombre y resumen EN/ES. Activá variantes,
   asigná ambos tipos y guardalo como borrador.
4. Para cada variante completa usá un SKU nuevo, ARS activo, precio `125050`
   centavos y stock `3`. No reutilices combinaciones eliminadas: eso pertenece al hito 3.

Ejecutá estos casos en ES y EN; para los recorridos de interfaz repetí a 1440 px
y 390 px, incluyendo Tab, Shift+Tab y Enter:

| Caso                           | Pasos                                                                                                                                                                            | Resultado esperado                                                                                                                             |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Borrador vacío                 | Creá una variante sin opciones y guardá el borrador.                                                                                                                             | Se guarda sin combinación vendible; no se puede comprar.                                                                                       |
| Borrador parcial               | Seleccioná solo Tamaño y guardá el borrador; después intentá publicar.                                                                                                           | El borrador se guarda; publicar señala que falta un valor por tipo.                                                                            |
| Combinación completa           | Seleccioná Tamaño y Envase y publicá la variante; luego publicá el producto.                                                                                                     | Ambas publicaciones funcionan. Seleccioná esa variante en tienda y agregala: el carrito conserva sus IDs, opciones y precio ARS 1.250,50.      |
| Edición estable                | Volvé a guardar la variante sin cambiar opciones; intentá vaciar una opción y guardar como borrador.                                                                             | El primer guardado funciona; el segundo rechaza redefinir una combinación asignada.                                                            |
| Configuración ausente          | En otro producto sin tipos, intentá publicar una variante con opciones mediante una solicitud autenticada de prueba.                                                             | Error localizado en `product`; no infiere tipos a partir de las opciones.                                                                      |
| Tipo incorrecto o repetido     | En una solicitud autenticada, enviá dos valores de Tamaño o un valor de un tipo no asignado al producto.                                                                         | Error en `options`; no se publica. No alteres permisos para ejecutar la prueba.                                                                |
| Configuración solo en borrador | En un producto publicado, agregá un tipo únicamente al borrador. Creá una variante nueva con esa configuración y guardala como borrador; intentá publicarla.                     | El borrador usa la configuración editorial; publicar rechaza la combinación que no coincide con la configuración pública.                      |
| Conversión de producto simple  | En un producto simple publicado de prueba, despublicá, activá variantes y guardá los tipos. Publicá una variante completa y después el producto.                                 | No hay bloqueo circular de publicación. El producto no se compra durante la preparación; al terminar se agrega la variante exacta.             |
| Carrito obsoleto               | Agregá una variante y luego, en la base de prueba mediante el CMS, modificá la configuración pública para que ya no coincida. Intentá aumentar la cantidad del carrito anterior. | La mutación se rechaza sin sustituir la variante. Registrá cualquier bloqueo previo de publicación como resultado, no como prueba del carrito. |

Si el editor impide enviar una combinación inválida, usá la solicitud de guardado
capturada en DevTools sobre datos descartables, conservando autenticación y CSRF.
No incluyas cookies, tokens ni cabeceras de autorización en la evidencia.

Registrá por caso: fecha, commit, idioma, ancho, IDs de prueba, pasos, resultado
real, aprobado/fallido/bloqueado y captura o respuesta sin secretos. No marques
aprobado un caso que no ejecutaste. Para repetir las pruebas automáticas:

```bash
npm run test:task-04
```

Si el lanzador local de npm está roto, el comando equivalente es:

```bash
node --import ./tests/register.mjs --test tests/catalog.test.mjs tests/product-publication.test.mjs tests/catalog-revalidation.test.mjs tests/sellable-items.test.mjs
```

### Hito 2 — SKU estable (PMG-357)

Estado: pendiente de ejecución manual. Usá datos descartables; repetí en productos
simples y variantes, en ES/EN y con teclado.

Preparación: anotá el commit, los IDs de prueba y el SKU original. Para variantes,
configurá primero el producto según el hito 1. Probá a 1440 px y 390 px con Tab,
Shift+Tab y pegado desde el portapapeles. No uses registros comerciales reales.

- [ ] Creá un registro sin SKU y guardalo como borrador. Reabrilo, escribí un SKU
      completo, corregí caracteres y pegá texto: no se bloquea con la primera letra.
- [ ] Provocá un error de guardado en otro campo: el SKU no guardado sigue editable.
      Corregí el error y guardá; el SKU normalizado queda en solo lectura, también al recargar.
- [ ] Verificá que etiqueta SKU, ayuda y errores sean visibles. Con un SKU duplicado,
      el error debe aparecer sin bloquear la corrección del valor todavía no guardado.
- [ ] Con un usuario sin permiso de edición, verificá que el campo no permita cambios.
- [ ] Mediante una solicitud autenticada de prueba, intentá cambiar y vaciar un SKU
      persistido, también al activar variantes en el producto: error en `sku`, sin persistir cambios.
- [ ] Editá stock sin enviar SKU: se conserva el identificador existente.
- [ ] Al activar variantes, enviá el mismo SKU con minúsculas y espacios por API:
      la respuesta y una lectura posterior conservan exactamente el SKU original.
- [ ] Duplicá un registro desde el editor: antes del primer guardado, el SKU de
      la copia debe poder reemplazarse por uno nuevo, sin modificar el original.
- [ ] Tras el primer guardado exitoso, comprobá el bloqueo sin recargar la página;
      después recargá y verificá que se mantenga. Un guardado fallido no debe bloquearlo.

Para las pruebas de API, capturá una solicitud legítima de guardado en DevTools y
modificá solo los campos indicados, conservando autenticación y CSRF. Después de
cada rechazo, consultá el registro nuevamente: el SKU persistido no debe cambiar.
Las pruebas de permisos deben usar una cuenta sin edición; una respuesta denegada
es válida aunque el editor no permita abrir el formulario. No compartas tokens ni cookies.

Registrá fecha, commit, idioma, resultado real y evidencia sin credenciales.
Las pruebas automatizadas del componente simulan el contexto de Payload; no
reemplazan verificar el formulario real después de guardar y ante errores.

### Hito 3 — Esquema y migraciones (PMG-358)

Evidencia automática del 11/09/2026: cadena completa de migraciones, comparación
sin diferencias entre snapshot y esquema, reutilización de combinaciones eliminadas,
rechazo de restauración conflictiva por Payload y PostgreSQL, rollback/reaplicación
de alineación y rollback fallido transaccional del índice global: aprobados en una
base local descartable. La prueba también conservó IDs, precios y relaciones del
carrito al revertir y reaplicar la tarea 4. Pasaron las 75 pruebas unitarias,
TypeScript del CMS y lint de los archivos modificados. Los builds completos y
la aceptación visual no se repitieron para este hito.

Estado: verificación manual pendiente. Usá una copia descartable con respaldo;
no pruebes rollback ni generación automática sobre producción.

- [ ] Aplicá la cadena completa y verificá que no se pierdan IDs, SKU, precios ni versiones.
- [ ] En un producto borrador, creá una variante completa, enviala a la papelera y
      creá otra con las mismas opciones y otro SKU: debe guardarse.
- [ ] Restaurá la primera mientras la segunda ocupa la combinación: debe rechazarse.
      Eliminá definitivamente la segunda solo en la base de prueba y restaurá la primera.
- [ ] Intentá crear dos variantes no eliminadas con iguales opciones: debe rechazarse,
      también ante escrituras que lleguen directamente al índice PostgreSQL.
- [ ] Guardá dos borradores sin opciones: ambos deben persistir sin combinación asignada.
- [ ] Discontinuá una variante sin enviarla a la papelera: su combinación sigue ocupada.
- [ ] Guardá productos y variantes manualmente y verificá sus versiones. Dejá el editor
      abierto sin guardar: no debe emitir solicitudes de autosave.
- [ ] Compará el esquema generado con el snapshot de alineación: sin diferencias.
- [ ] Con una combinación reutilizada, revertí solo la alineación y reaplicala:
      debe funcionar y conservar el índice parcial. Revertir además el índice parcial
      debe fallar transaccionalmente, sin borrar registros ni dejar de proteger combinaciones.

Antes del rollback de alineación, exportá las filas de versiones de los productos
y variantes de prueba, incluidos los indicadores históricos de autosave. Compará
el contenido completo después de revertir y reaplicar: debe permanecer idéntico.
Después de un rollback fallido del índice parcial, verificá que ambas variantes
sigan presentes, que solo una esté eliminada y que restaurarla aún se rechace.

La prueba aislada cubre estos casos con aserciones de datos y del índice que causa
el conflicto, no solo con la presencia de un error. Las operaciones SQL directas
son pruebas de integridad únicamente sobre la base descartable; no son un flujo editorial.

Registrá commit, migraciones ejecutadas, IDs descartables y resultados reales.
El script aislado se ejecuta desde `apps/cms` con
`node --import tsx scripts/test-task-04.mjs`; no reemplaza la revisión del editor.

### Hito 4 — Aceptación integrada (PMG-359)

Estado: en curso; no habilita cerrar PMG-221. Evidencia inicial del 11/09/2026;
los bloqueos de esta tabla se actualizaron en la sección de correcciones más abajo:

| Verificación                       | Resultado                   | Alcance                                                                                                                               |
| ---------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Build storefront                   | Aprobado                    | Compilación de producción, TypeScript y generación de rutas.                                                                          |
| Build CMS                          | Aprobado                    | Compilación de producción, TypeScript y generación de rutas.                                                                          |
| Lint storefront                    | Aprobado con 7 advertencias | Sin errores; advertencias preexistentes.                                                                                              |
| Lint CMS                           | Bloqueado                   | 2 errores preexistentes de enlaces en `apps/cms/src/app/(frontend)/page.tsx`, además de 17 advertencias.                              |
| PostgreSQL → storefront → checkout | Aprobado                    | Datos persistidos reales, mapeo de carrito y validación local, ES/EN, identidad exacta, cantidad y ARS. Sin solicitud a Mercado Pago. |
| Precio modificado                  | Aprobado en integración     | El snapshot anterior conserva precio; checkout rechaza hasta confirmar el precio nuevo.                                               |
| Variante discontinuada             | Aprobado en integración     | Conserva la línea y su identidad; checkout rechaza la compra.                                                                         |
| Tienda EN en navegador             | Parcial                     | Renderiza navegación, filtros y aviso de error; la API CMS configurada no está disponible. No se verificó compra de productos.        |
| Tienda ES en navegador             | Bloqueado                   | `/es/shop` redirige a `/es/tienda`; `/es/tienda` responde 308 hacia sí misma. Reproducido con localhost y 127.0.0.1.                  |
| Móvil, teclado y pago de prueba    | Pendiente                   | No hay aceptación integrada completa ni evidencia visual de las variantes.                                                            |

El script de integración ahora obtiene carritos persistidos con profundidad 3 en
ES/EN antes y después de cambiar precio, confirmar y discontinuar. Los envía por
stdin a `tests/verify-persisted-commerce.mjs`, ejecutado con el entorno TypeScript
del storefront. No guarda snapshots con secretos en archivos ni realiza pagos.
Ejecutá desde `apps/cms`: `node --import tsx scripts/test-task-04.mjs`.

Para completar este hito:

1. Mantener el hostname local coherente según las instrucciones siguientes.
2. Levantar un CMS con datos descartables y conectar el storefront sin migrar
   automáticamente la base habitual. Crear variantes con precio, stock y medios distintos.
3. Ejecutar el recorrido visual completo de la siguiente sección en ambos idiomas
   y anchos. Registrar capturas y resultados de teclado, selección, carrito y recuperación.
4. Verificar la entrega al checkout con credenciales de prueba, sin cobros reales.
5. Registrar las advertencias preexistentes de lint antes del cierre.

#### Correcciones verificadas

- Ambos builds de producción volvieron a pasar. Lint CMS ahora termina sin errores,
  con 17 advertencias, después de usar Link en los enlaces de su portada.
- El bucle era del entorno de prueba, no del código de rutas: al enlazar el servidor
  a `127.0.0.1`, las reescrituras hacia `localhost` se trataban como externas y volvían
  a ejecutar Proxy. Se verificó el código original con el servidor en `localhost`.
- La API CMS y `/admin` responden 200. Se inició desarrollo con
  `PAYLOAD_MIGRATING=true` para impedir schema push; no se aplicaron migraciones a
  la base habitual. Esta opción no reemplaza las migraciones de producción.
- La tienda ES mostró 7 productos en navegador. Se usó una URL nueva porque el
  navegador conservaba el 308 anterior. Usá un perfil limpio o quitá esa caché para repetir.

Inicio del storefront de producción local desde la raíz:

```powershell
node node_modules/next/dist/bin/next start --hostname localhost --port 3000
```

Prueba de regresión en otra terminal, con ese servidor iniciado:

```powershell
$env:ROUTING_TEST_URL = 'http://localhost:3000'
node --test tests/routing-http.test.mjs
```

Pasaron las seis rutas de tienda/carrito ES/EN, alias y conservación de la búsqueda.
Sin la variable, la prueba se omite explícitamente. Esto no verifica selección de
variantes, pago, imágenes ni accesibilidad: esos recorridos siguen pendientes.

### Aceptación general de la tarea 4

Prepará una base descartable con las migraciones anteriores y un carrito existente.
Aplicá las migraciones nuevas; comprobá IDs, importes, relaciones, SKU, etiquetas
EN/ES y rollback. Probá también dos registros con la misma combinación: el backfill
debe fallar sin fusionarlos ni borrar registros.

Repetí el flujo en ES y EN, a 1440 px y 390 px, usando también Tab, Shift+Tab,
Enter y barra espaciadora:

- [ ] Creá un producto simple y cacao de 100 g/500 g con SKU, precio y medios distintos.
- [ ] Traducí etiquetas sin cambiar códigos, IDs o slug; verificá el selector.
- [ ] Comprobá precio de listado, destacados y relacionados; agotados no bajan el mínimo.
- [ ] Cambiá tamaño: precio, imagen, contenido neto y cantidad se actualizan juntos.
- [ ] Agregá cada variante; verificá opciones, precio unitario, total y fallback de imagen.
- [ ] Recargá y cambiá idioma: no cambia la identidad ni la moneda ARS.
- [ ] Editá un precio en CMS y verificá revalidación y aviso de precio modificado.
- [ ] Confirmá el nuevo precio y entrá al checkout de prueba con la variante exacta.
- [ ] Discontinuá una variante en carrito; checkout se bloquea y se puede quitar.
- [ ] Probá dos líneas inválidas y quitá una por vez; no se pierde la otra línea.
- [ ] Probá precio ausente, cero, fraccionario, SKU duplicado y combinación duplicada.
- [ ] Probá contenido neto incompleto y medidas negativas; el CMS debe rechazarlos.
- [ ] Probá pieza única con cantidad dos y dos líneas del mismo ítem por API.
- [ ] Probá solicitudes fallidas y estado pendiente: la selección válida se conserva.
- [ ] Confirmá que visitantes/clientes no reciben medidas privadas ni stock nuevo exacto.
- [ ] Probá cambios simultáneos de SKU en producto y variante; PostgreSQL rechaza duplicados.

No marques estas casillas por el resultado de pruebas con HTTP simulado: requieren
CMS persistente, navegador y credenciales de pago de prueba cuando correspondan.
