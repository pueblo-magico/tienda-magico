# Despliegue automático a staging

El workflow [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml)
despliega automáticamente cada commit que llega a la rama `staging`. En el
flujo normal, esto sucede al mergear un pull request contra esa rama.

## Preparación inicial

1. Prepará la VM siguiendo [`deploy/manual/README.md`](../../deploy/manual/README.md).
2. Creá el Environment `staging` en **GitHub -> Settings -> Environments**.
3. Configurá estas variables del Environment:

| Variable                  | Uso                                                          |
| ------------------------- | ------------------------------------------------------------ |
| `SHOP_URL`                | Origen HTTPS público del storefront, sin `/` final           |
| `CMS_URL`                 | Origen HTTPS público del CMS, sin `/` final                  |
| `DEPLOY_PLATFORM`         | `linux/amd64` o `linux/arm64`, según la VM                   |
| `SSH_HOST`                | Dominio o IP pública de la VM                                |
| `SSH_PORT`                | Puerto SSH; normalmente `22`                                 |
| `SSH_USER`                | Usuario no root habilitado para desplegar                    |
| `CHECKOUT_PROVIDER`       | Adaptador de checkout; usá `mercado-pago` en staging         |
| `MERCADOPAGO_SANDBOX`     | `true` para credenciales y pagos de prueba                   |
| `MERCADOPAGO_WEBHOOK_URL` | `SHOP_URL` seguido por `/api/checkout/webhooks/mercado-pago` |

4. Configurá estos secretos del Environment:

| Secreto                    | Uso                                                   |
| -------------------------- | ----------------------------------------------------- |
| `SSH_PRIVATE_KEY`          | Clave privada Ed25519 exclusiva para despliegues      |
| `SSH_KNOWN_HOSTS`          | Clave de host de la VM verificada previamente         |
| `MERCADOPAGO_ACCESS_TOKEN` | Credencial de prueba de Mercado Pago para el servidor |

5. Confirmá que el usuario SSH pueda ejecutar `sudo -n true` y que los archivos
   de entorno de `/opt/tienda-magico/env` no contengan placeholders.

El workflow administra las cuatro claves de checkout de `storefront.env` en
cada despliegue y conserva todas las demás claves existentes. Los secretos de
base de datos, Payload, API del CMS y revalidación siguen administrados en la VM.

| Configuración                                                  | Responsable                  | Etapa                 |
| -------------------------------------------------------------- | ---------------------------- | --------------------- |
| `SHOP_URL`, `CMS_URL`                                          | Variable de GitHub           | Build de imágenes     |
| `CHECKOUT_PROVIDER`                                            | Variable de GitHub           | Despliegue en runtime |
| `MERCADOPAGO_SANDBOX`                                          | Variable de GitHub           | Despliegue en runtime |
| `MERCADOPAGO_WEBHOOK_URL`                                      | Variable de GitHub           | Despliegue en runtime |
| `MERCADOPAGO_ACCESS_TOKEN`                                     | Secreto de GitHub            | Despliegue en runtime |
| Secretos de base de datos, Payload, API del CMS y revalidación | Archivos de entorno de la VM | Runtime               |

Los secretos de runtime nunca se pasan como argumentos de build ni se escriben
en el resumen del workflow. Durante la activación se respaldan los archivos de
entorno del storefront y del despliegue. Si la activación falla, se restauran
ambos archivos y se reinicia el release anterior.

## Configuración recomendada de la rama

Protegé `staging` en **GitHub -> Settings -> Branches**:

- exigí pull requests antes de mergear;
- exigí que pasen los checks del repositorio;
- bloqueá force pushes y eliminación de la rama;
- agregá una aprobación al Environment `staging` si querés una confirmación
  humana antes de cada despliegue.

La protección de rama controla qué código puede llegar a `staging`. El
Environment controla quién puede autorizar el acceso a la infraestructura.

## Desplegar un cambio

1. Actualizá tu rama con `staging` y resolvé conflictos.
2. Abrí un pull request con base `staging`.
3. Confirmá que los checks requeridos estén verdes.
4. Mergeá el pull request.
5. Abrí **Actions -> Deploy staging** y seguí la ejecución.

El workflow construye imágenes inmutables con la etiqueta
`staging-SHA_CORTO`, verifica el checksum, las copia por SSH, activa el release,
espera los health checks internos y comprueba los endpoints HTTPS públicos.

## Verificación posterior

Al terminar, revisá el resumen de la ejecución y verificá:

- el storefront en `SHOP_URL`;
- el panel del CMS en `CMS_URL/admin`;
- inicio de sesión y navegación principal del CMS;
- catálogo, carrito y selección del método de entrega;
- un checkout de prueba cuando el cambio afecte pagos;
- que la versión desplegada corresponda al SHA mergeado.

Para inspeccionar la VM:

```bash
sudo docker compose \
  --env-file /opt/tienda-magico/deployment.env \
  -f /opt/tienda-magico/compose.yml ps
sudo docker compose \
  --env-file /opt/tienda-magico/deployment.env \
  -f /opt/tienda-magico/compose.yml logs --tail=200
```

## Rollback

1. Buscá una etiqueta anterior exitosa en **Actions -> Deploy staging**.
2. Elegí **Run workflow** sobre la rama `staging`.
3. Ingresá esa etiqueta en `existing_tag`.
4. Ejecutá el workflow y repetí la verificación posterior.

El rollback cambia las imágenes de aplicación, pero no revierte migraciones de
base de datos ni archivos subidos. Antes de una migración riesgosa, generá y
copiá fuera de la VM un backup de PostgreSQL y del directorio de medios.

## Diagnóstico rápido

- **Falla de configuración:** revisá variables y secretos del Environment.
- **Falla SSH:** verificá host, puerto, usuario, clave y `SSH_KNOWN_HOSTS`.
- **Falla de activación:** revisá los logs de CMS, storefront y PostgreSQL.
- **Health checks internos verdes pero smoke check rojo:** revisá DNS, Caddy,
  certificados TLS, firewall y que `SHOP_URL`/`CMS_URL` coincidan con la VM.
- **Migración fallida:** no fuerces la activación; restaurá el backup o corregí
  la migración antes de reintentar.

La referencia técnica completa está en
[`docs/deploy/github-actions.md`](github-actions.md).

Versión en inglés: [`docs/deploy/staging.md`](staging.md).
