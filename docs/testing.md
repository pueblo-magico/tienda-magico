# Estrategia de pruebas

La migración combina tres capas. La suite heredada de `node:test` se conserva
mientras los casos nuevos y los casos migrados usan Vitest. Playwright valida
recorridos que requieren una aplicación Next.js real, incluidos los Server
Components asíncronos.

## Comandos

| Comando                   | Alcance                                                   |
| ------------------------- | --------------------------------------------------------- |
| `npm test`                | Pruebas migradas con Vitest en modo puntual               |
| `npm run test:all`        | Suite heredada, Vitest y Playwright                       |
| `npm run test:legacy`     | Todos los casos existentes de `node:test`                 |
| `npm run test:unit`       | Pruebas unitarias y de componentes con Vitest             |
| `npm run test:watch`      | Vitest en modo watch                                      |
| `npm run test:ui`         | Interfaz de Vitest con cobertura habilitada               |
| `npm run test:coverage`   | Cobertura V8 en consola, HTML y LCOV                      |
| `npm run test:report`     | Reporte HTML estático de Vitest con cobertura             |
| `npm run test:e2e`        | Recorridos Playwright en escritorio y móvil               |
| `npm run test:e2e:ui`     | Interfaz interactiva de Playwright                        |
| `npm run test:e2e:report` | Último reporte HTML de Playwright                         |
| `npm run test:ci`         | Vitest con cobertura y Playwright como puerta incremental |

La cobertura HTML queda en `coverage/vitest`. El reporte de Vitest queda en
`.vitest` y el de Playwright en `playwright-report`. Estos directorios son
artefactos locales o de CI y no se versionan.

En CI, Vitest y Playwright se ejecutan como trabajos independientes y en
paralelo. Cada trabajo publica su propio artefacto; un tercer trabajo descarga
ambos resultados y genera el resumen nativo con totales, fallas, cobertura y
entornos E2E. La puerta `Storefront` conserva un único resultado agregado para
protección de ramas, mientras los reportes HTML detallados permanecen
disponibles como artefactos descargables.

En esta primera etapa, la cobertura V8 incluye los módulos importados por las
pruebas migradas. No se publica todavía un porcentaje global: el defecto
[vitest-dev/vitest#10475](https://github.com/vitest-dev/vitest/issues/10475)
puede omitir archivos TypeScript no importados al intentar construir cobertura
para todo `src`. Se ampliará el alcance cuando esa medición resulte confiable;
hasta entonces, el reporte describe solamente el código efectivamente
ejercitado.

Playwright inicia el storefront en el puerto 3100. Para validar otro entorno,
definí `PLAYWRIGHT_BASE_URL`; en ese caso Playwright no inicia un servidor
local.

La suite heredada está visible, pero no es todavía una puerta de CI: la línea
base de `origin/develop` contiene fallos anteriores en estados de efectivo,
revalidación del catálogo, contratos de composición y proyecciones de pagos.
`test:legacy` y `test:all` deben seguir mostrando esos fallos hasta que se
estabilicen en cambios separados; no se omiten ni se convierten artificialmente
en éxitos. La puerta incremental evita agregar regresiones nuevas mientras esa
deuda se resuelve.

## Clasificación

- **Dominio:** reglas puras, validación y mapeo. Usá Vitest con entorno Node y
  simulá únicamente límites externos.
- **Componentes cliente:** interacciones observables con React Testing Library,
  consultas por rol o etiqueta y estados accesibles.
- **E2E:** rutas, Server Components asíncronos, localización y recorridos que
  atraviesan límites de la aplicación con Playwright.
- **Contratos estructurales:** pruebas heredadas que leen archivos fuente para
  proteger una decisión arquitectónica explícita. No cuentan como prueba del
  comportamiento en ejecución ni justifican cobertura funcional.
- **Integración del CMS:** pruebas dentro de `apps/cms`, con su propia
  configuración y una base PostgreSQL descartable cuando la garantía dependa de
  persistencia. Esta etapa no mezcla dependencias del CMS con el storefront.

## Migración gradual

1. Conservá el caso heredado hasta que la prueba nueva cubra el mismo contrato.
2. Preferí resultados públicos frente a nombres de componentes, cadenas de
   clases o detalles internos.
3. Migrá primero pagos, inventario, autenticación, publicación y autorización.
4. Medí una línea base global confiable antes de fijar umbrales. Los umbrales
   pueden subir de manera gradual; no deben reducirse para ocultar una
   regresión.
5. Ejecutá Chromium en cada cambio. Ampliá a Firefox y WebKit cuando la matriz
   de CI esté preparada, sin multiplicar todos los recorridos innecesariamente.

Para cambios de comportamiento, seguí rojo, verde y refactorización. Los cambios
exclusivos de configuración o documentación se verifican con los comandos que
ejercitan el artefacto correspondiente y no requieren inventar una falla de
producto.
