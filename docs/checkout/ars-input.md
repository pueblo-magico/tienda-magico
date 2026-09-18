# Importes ARS en formularios

El storefront centraliza el formato y la conversión en `src/lib/money/ars-input.ts`. El CMS mantiene su espejo en `apps/cms/src/utilities/arsInput.ts` porque se construye desde un contexto Docker independiente. Actualizá ambos archivos juntos: `tests/ars-input.test.mjs` ejecuta el mismo contrato contra ambas implementaciones. No se comparten dependencias ni componentes React entre aplicaciones.

- La interfaz recibe pesos enteros y agrupa miles con puntos, también en inglés: `20000` → `20.000`.
- Los formularios convierten una sola vez al enviar: `20.000` → `2000000` centavos. Las APIs, auditorías, precios almacenados y validaciones del servidor conservan sus unidades actuales.
- No se redondean pagos, ni se convierten decimales o valores inválidos silenciosamente. Los importes fraccionarios históricos no se modifican; requieren conciliación fuera de estos formularios de pesos enteros.
- No hay migración de datos ni cambios de configuración monetaria. No cambies los decimales de la moneda a cero: alteraría la interpretación de importes existentes.
- El storefront usa `Input` con `format="ars-pesos"` (ejemplos en `/ui-system/input`); el CMS compone `TextInput` mediante `ArsAmountInput`.

## Prueba manual

1. En caja del storefront y en las confirmaciones de efectivo y transferencia del CMS, escribí `20000`: debe verse `20.000`.
2. Insertá y borrá dígitos al comienzo, en el medio y al final. Seleccioná todo, reemplazá el importe y dejá el campo vacío.
3. Pegá `20.000`; debe conservar el mismo valor. Probá `20,50`, `20.50`, negativos, cero e importes excesivos: no deben enviar una confirmación válida.
4. Confirmá un pedido de prueba de $ 20.000: la solicitud debe contener `amount: 2000000`. Un importe distinto debe ser rechazado por el servidor.
5. Repetí en ES/EN, escritorio y móvil. Verificá navegación con teclado, estado deshabilitado durante el envío y mensajes de error.
