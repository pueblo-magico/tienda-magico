# Verificación de PMG-221

Estado: implementación en revisión; aceptación integrada pendiente.

## Evidencia automática

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
