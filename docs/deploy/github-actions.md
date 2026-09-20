# Despliegue automático desde GitHub Environments

## Configuración inicial

No se necesita una instalación local ni editar archivos de entorno en la VM. El workflow instala Docker si hace falta, instala el kit y genera deployment.env, storefront.env, cms.env y postgres.env desde GitHub. La VM debe tener Linux compatible con el instalador, SSH, sudo no interactivo, conectividad y los puertos 80/443 disponibles. Configurá DNS antes del primer despliegue.

Creá los Environments staging y production, restringidos a sus ramas respectivas. Usá VMs independientes: ambas instalaciones usan /opt/tienda-magico y /var/lib/tienda-magico.

### Variables del Environment

| Variable | Valor |
| --- | --- |
| SHOP_URL | Origen público de la tienda, sin barra final |
| CMS_URL | Origen público del CMS, sin barra final |
| DEPLOY_PLATFORM | linux/amd64 o linux/arm64 |
| SSH_HOST | Host de la VM |
| SSH_USER | Usuario con sudo no interactivo |
| SSH_PORT | Opcional; 22 por defecto |
| CHECKOUT_PROVIDER | mercado-pago |
| MERCADOPAGO_SANDBOX | true en staging; false en production |
| MERCADOPAGO_WEBHOOK_URL | SHOP_URL/api/checkout/webhooks/mercado-pago |
| POSTGRES_USER | Opcional; postgres por defecto |
| POSTGRES_DB | Opcional; tienda_magico_cms por defecto |

### Secrets del Environment

- SSH_PRIVATE_KEY y SSH_KNOWN_HOSTS: clave dedicada y host verificado por un canal confiable.
- POSTGRES_PASSWORD: contraseña estable de PostgreSQL.
- PAYLOAD_SECRET: secreto estable del CMS.
- STOREFRONT_REVALIDATION_SECRET: secreto compartido; se escribe igual en tienda y CMS.
- MERCADOPAGO_ACCESS_TOKEN y MERCADOPAGO_WEBHOOK_SECRET: credenciales del entorno correspondiente.
- PAYLOAD_ECOMMERCE_API_KEY y PAYLOAD_CMS_API_KEY: opcionales durante el arranque; configurá las claves de los usuarios de integración del CMS cuando estén disponibles para habilitar los flujos que requieren acceso autenticado.

Las constantes de infraestructura (puertos internos, HOSTNAME, proveedor Payload, moneda ARS y locales) se generan desde el código. Los dominios, DATABASE_URL, CORS y revalidación se derivan de las variables y secretos para evitar contradicciones.

Los valores no pueden incluir saltos de línea, comillas simples ni barras invertidas. Los archivos usan valores entre comillas simples para conservar literalmente caracteres como $ y #. La contraseña se codifica al construir DATABASE_URL. No se imprimen los archivos ni se incluyen en las imágenes: se transfieren por SSH con permisos restrictivos y se eliminan los temporales.

## Despliegue

El workflow se divide en cuatro jobs secuenciales: `prepare` valida configuración y publica únicamente metadatos del release; `build` compila y sube el tar de imágenes con su checksum como artefacto de Actions (retención de un día); `deploy` descarga, verifica, transfiere, activa y comprueba los endpoints; `tag` crea la etiqueta anotada exclusivamente tras un despliegue exitoso de producción. Solo `tag` tiene permiso de escritura en el repositorio.

Los archivos con secretos nunca se publican como artefactos ni outputs: se validan y eliminan en `prepare`, y se generan nuevamente en `deploy` desde el Environment. Al usar `existing_tag`, `build` no compila ni transfiere imágenes, pero permite continuar la activación. Todos los jobs conservan el Environment de la rama y pueden requerir su aprobación configurada.

Los pushes a staging y production generan imágenes, archivo con checksum, transferencia y activación en la VM. Producción requiere HTTPS. Las ejecuciones manuales desde otras ramas se omiten.

Las etiquetas de producción tienen formato production-SHA-RUN_ID-RUN_ATTEMPT; staging usa staging-SHA. Compose espera los health checks internos de tienda, CMS y PostgreSQL. Luego se comprueban las URLs públicas. Solo después se crea una etiqueta Git anotada para una nueva compilación de producción. Actions necesita contents: write y permiso para crear etiquetas.

El input existing_tag activa una imagen ya disponible en la VM sin compilar ni crear una nueva etiqueta Git. Usa la configuración actual del Environment.

## Datos, migraciones y recuperación

GitHub es la fuente de configuración en cada despliegue. Antes de migrar una VM existente, copiá sus valores vigentes a los secrets del Environment; no generes otro PAYLOAD_SECRET ni otra contraseña de PostgreSQL. No guardes valores reales en el repositorio.

Con una base PostgreSQL inicializada, el despliegue rechaza cambios en usuario, base o contraseña: cambiar un archivo no rota las credenciales de una base existente. Realizá la rotación mediante un procedimiento coordinado y explícito.

La activación guarda los cuatro archivos anteriores y los restaura si falla. Solo intenta reactivar la versión previa cuando detectó una tienda en ejecución; un primer despliegue fallido no intenta descargar la etiqueta del ejemplo. No se eliminan datos ni se revierten migraciones. Un fallo del chequeo público o del push del tag puede dejar el release nuevo activo.

Este workflow no incorpora un ejecutor de migraciones ni crea usuarios del CMS. Aplicá el procedimiento de migraciones del release y completá el alta inicial del administrador y de los usuarios de integración del CMS. No confundas la generación automática de configuración con la preparación funcional de una tienda nueva.

## Verificación

Ejecutá las pruebas de despliegue con node --test tests/deployment-config.test.mjs tests/deployment-branches.test.mjs tests/deployment-runtime-env.test.mjs. Validá además un primer despliegue en una VM de prueba, un redeploy y un fallo de activación antes de publicar en producción.
