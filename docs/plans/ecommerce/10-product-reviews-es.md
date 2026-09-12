# 10 — Reseñas moderadas de productos y compras verificadas de invitados

Estado: planificado. Depende de: 03, 07.

## Prompt de implementación para Codex

Implementá reseñas reales de productos con moderación y privacidad. Seguí `docs/plans/ecommerce/README.md`.

### Pedido de funcionalidad

Agregá Reseñas con producto, variante opcional, rating entero 1-5, título opcional, cuerpo, idioma original, nombre público para mostrar, preferencia de visualización anónima, relación privada opcional con cliente, referencia privada a línea de orden calificante, estado de moderación, timestamps y respuesta del comercio localizada opcional.

Mantené el texto escrito por el cliente en su idioma original. No exijas dos traducciones ni sobrescribas originales; diferí la traducción automática. La visualización pública anónima no implica permitir envíos anónimos no verificados. La elegibilidad inicial de envío es una compra verificada calificante, incluidos compradores invitados mediante una invitación de uso único que expira. Determiná la infraestructura disponible de entrega de invitaciones antes de agregar dependencias; no introduzcas un nuevo proveedor de email sin aprobación.

Verificá invitaciones/propiedad de orden en servidor, guardá hashes de tokens, excluí referencias sensibles de respuestas públicas, limitá tasa de envíos y rechazá reseñas duplicadas según la política acordada de compra/producto. Las reseñas empiezan pendientes. Moderadores aprueban/rechazan contenido; la aprobación no puede fabricar un badge de compra verificada. El rating promedio y el conteo derivan solo de reseñas aprobadas e invalidan en cambios de moderación.

### Definición de terminado

- [ ] Compradores verificados con cuenta e invitados pueden enviar una reseña usando flujos autorizados.
- [ ] La visualización anónima oculta identidad pero no saltea verificación de compra.
- [ ] Contenido no aprobado e identificadores de cliente/orden/invitación nunca aparecen en lecturas públicas.
- [ ] Se prueban ratings inválidos, invitaciones vencidas/reutilizadas, propiedad incorrecta, duplicados, intentos de spam y texto inseguro.
- [ ] Ratings/conteos de producto coinciden con registros aprobados después de aprobación, rechazo y remoción.
- [ ] La UI de reseñas muestra idioma original, estados vacío/loading/error y etiquetas de interfaz accesibles en EN/ES.
- [ ] La dependencia de entrega está implementada y verificada o reportada explícitamente como bloqueada; no hay afirmaciones falsas de éxito de email.
- [ ] Migración, guía de moderación, pruebas de privacidad y verificación compartida están completas.

### Fuera de alcance

Envíos públicos de reseñas no verificadas, reseñas con imagen/video, traducción automática y scoring de recomendaciones.
