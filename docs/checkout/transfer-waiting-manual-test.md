# Transferencia: prueba manual de la página de espera

## Alcance

Este hito muestra el tiempo restante y consulta el estado persistido cada diez segundos mientras la pestaña está visible. El vencimiento es informativo: no cancela pedidos, libera stock ni verifica movimientos bancarios. La conciliación de Mercado Pago y el procesamiento persistente del vencimiento siguen pendientes.

## Verificación

1. En un entorno de prueba, habilitá transferencia en Commerce Settings y configurá un plazo de un minuto. Completá un carrito con nombre y email válidos.
2. Elegí transferencia y continuá. Verificá referencia UUID, importe, instrucciones y cuenta regresiva. Recargá: el plazo no debe reiniciarse.
3. En las herramientas del navegador, comprobá una actualización de la ruta aproximadamente cada diez segundos. Cambiá a otra pestaña: no deben comenzar nuevas consultas mientras esté oculta. Al regresar, debe consultar nuevamente.
4. Esperá el vencimiento. Debe aparecer el aviso de plazo vencido y desaparecer el titular y el alias/CVU. La tarjeta debe conservar la referencia, el importe del pedido y el vencimiento. El pedido y el inventario no deben cambiar por esta acción.
5. Usá la [acción administrativa de verificación](manual-transfer-confirmation.md) del entorno de prueba para confirmar el pago. No edites `paymentStatus` directamente. La página debe mostrar «Pago confirmado» en la siguiente consulta, incluso si el plazo ya venció. No debe continuar consultando automáticamente después de la confirmación.
6. Repetí con fixtures `rejected`, `cancelled` y `unverified`. Los tres deben ocultar las instrucciones; `unverified` debe permitir seguir consultando. Nunca uses movimientos reales para simular estas transiciones.
7. Abrí una referencia inexistente: debe mostrar el mensaje de pedido no encontrado. Agregar parámetros `amount` o `expires_at` a la URL no debe alterar los datos.
8. Repetí en español e inglés, a 390 px y 1440 px. Recorré los controles con Tab y activá «Consultar estado» con Enter. La cuenta regresiva no debe anunciarse cada segundo mediante el lector de pantalla.

## Reintentar con el mismo carrito

1. Dejá vencer un pedido y elegí «Intentar de nuevo». Revisá el carrito, nombre y email, y continuá con transferencia. Debe aparecer una referencia nueva y un plazo nuevo.
2. Repetí el checkout inmediatamente con el mismo carrito: debe reutilizar el intento nuevo. El pedido anterior debe conservar su referencia y plazo; no se elimina ni se marca como pagado.
3. Cambiá las cantidades antes de reintentar un pedido vencido. El nuevo pedido debe reflejar el carrito actual. Corregí cualquier aviso de precio o disponibilidad antes de continuar.
4. En el pedido vencido, elegí «Ya hice la transferencia»: debe mostrar la explicación de verificación y seguir consultando el pedido original, sin crear otro pedido ni cambiar su estado.
5. Un pedido aprobado o sin verificar no debe generar otro intento automáticamente. La conciliación de pagos tardíos sigue pendiente; esta funcionalidad no confirma ni duplica entregas.

## Límites de verificación

Las pruebas automatizadas cubren el cálculo temporal, el último segundo, los estados finales, valores desconocidos, relojes inválidos y las traducciones EN/ES. Con temporizadores simulados también verifican el intervalo de consulta, la pausa con pestaña oculta, el bloqueo durante una consulta en curso y la limpieza del temporizador y del listener. Los reintentos se prueban con un transporte simulado, incluido un conflicto de unicidad; esto no sustituye una prueba concurrente contra PostgreSQL. La integración de React con el navegador y los cambios persistidos requieren ejecutar los pasos anteriores. Este hito no agrega migraciones.
