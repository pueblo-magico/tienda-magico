# Despliegue automático de staging y producción

## Rama production

Cada compilación de producción usa una etiqueta única `production-SHA-RUN_ID-RUN_ATTEMPT`, evitando sobrescribir imágenes al reejecutar un commit. El workflow transfiere el archivo con checksum por SSH y activa las imágenes en la VM. Docker Compose espera los health checks internos de storefront, CMS y PostgreSQL (`--wait`); después se comprueban los endpoints públicos de tienda y CMS.

Solo si esas verificaciones pasan se crea y publica una etiqueta Git **anotada**, con el mismo nombre que la imagen, apuntando al commit desplegado. El token de Actions necesita `contents: write` y las reglas del repositorio deben permitir crear esas etiquetas. No se fuerzan ni se reemplazan etiquetas existentes. Una activación manual mediante `existing_tag` no crea otra etiqueta: conserva la trazabilidad del artefacto original. Si falla la publicación de la etiqueta, el workflow falla aunque la versión ya esté activa; ese fallo no revierte la base de datos ni la aplicación.

El workflow `.github/workflows/deploy.yml` despliega automáticamente los pushes a `staging` y `production`. Cada rama utiliza el GitHub Environment del mismo nombre, una cola independiente y etiquetas `staging-SHA` o `production-SHA`. Las ejecuciones manuales desde otras ramas se omiten. `main` no dispara despliegues.

Antes del primer despliegue de producción:

1. Creá el Environment `production` en GitHub y restringí sus ramas de despliegue a `production`. Configurá revisores obligatorios si necesitás una aprobación antes de publicar.
2. Prepará una VM de producción independiente siguiendo `deploy/manual/README.md`. No reutilices el destino de staging: el directorio remoto es `/opt/tienda-magico` en ambos casos. Configurá allí los secretos de base de datos y CMS, los dominios y las credenciales privadas de integración.
3. Cargá en ese Environment las variables `SHOP_URL`, `CMS_URL`, `DEPLOY_PLATFORM`, `SSH_HOST`, `SSH_PORT` (opcional; 22 por defecto), `SSH_USER`, `CHECKOUT_PROVIDER=mercado-pago`, `MERCADOPAGO_SANDBOX=false` y `MERCADOPAGO_WEBHOOK_URL`. Las dos URLs públicas deben usar HTTPS; el webhook debe ser `SHOP_URL/api/checkout/webhooks/mercado-pago`.
4. Cargá los secretos `SSH_PRIVATE_KEY`, `SSH_KNOWN_HOSTS`, `MERCADOPAGO_ACCESS_TOKEN` y `MERCADOPAGO_WEBHOOK_SECRET` con valores exclusivos de producción. Staging conserva `MERCADOPAGO_SANDBOX=true`.
5. Aplicá las migraciones pendientes del CMS según el procedimiento del release antes de publicar código que dependa de ellas. Este cambio no agrega ejecución automática de migraciones ni rollback de datos.
6. Fusioná el release en `production`. Verificá el resultado de Actions y los flujos de compra; los chequeos automáticos de endpoints no prueban un pago real.

Para activar una imagen existente, ejecutá manualmente el workflow seleccionando la rama correspondiente y su `existing_tag`. La reversión de imágenes no revierte migraciones de base de datos. No se configura ningún Environment ni se ejecuta un despliegue por modificar este archivo.

The staging workflow reproduces the proven manual artifact deployment without a
container registry. GitHub Actions builds all four Linux images, exports them as
one checksummed tar archive, copies the archive and deployment kit over SSH, and
activates the immutable release on the VM.

```text
GitHub Actions -> Docker artifact -> SCP -> staging VM -> Docker Compose
                                                    |-> Caddy
                                                    |-> storefront
                                                    |-> Payload CMS -> PostgreSQL
```

Runtime secrets remain in `/opt/tienda-magico/env` on the VM. They are never
sent to GitHub, used as Docker build arguments, or included in an image layer.

## Triggers and release tags

- Merging a pull request into `staging` produces a push event that builds and
  deploys the merged commit automatically.
- A manual run with `existing_tag` blank builds and deploys the selected commit.
- A manual run with `existing_tag` set skips the build and activates that tag if
  both application images still exist on the VM.

New releases use `staging-SHORT_COMMIT_SHA`, for example
`staging-1a2b3c4d5e6f`. The deployment concurrency group allows only one staging
release at a time.

## 1. One-time VM preparation

Complete the install and environment configuration in
[`deploy/manual/README.md`](../../deploy/manual/README.md) once. In particular,
the following files must already contain real staging values rather than example
domains or `CHANGE_ME` placeholders:

```text
/opt/tienda-magico/deployment.env
/opt/tienda-magico/env/storefront.env
/opt/tienda-magico/env/cms.env
/opt/tienda-magico/env/postgres.env
```

El usuario SSH de GitHub Actions necesita `sudo` sin contraseña únicamente para
un comando de despliegue instalado por root. Después de preparar Docker y los
archivos de entorno de la VM, copiá los tres scripts del commit revisado:

```bash
scp deploy/manual/automated-deploy.sh deploy/manual/vm-deploy.sh \
  deploy/manual/update-runtime-env.sh ADMIN@VM_HOST:/tmp/
```

Desde una sesión administrativa confiable en la VM, instalalos como root:

```bash
sudo install -d -m 755 /usr/local/lib/tienda-magico /etc/tienda-magico
sudo install -o root -g root -m 755 /tmp/automated-deploy.sh /usr/local/sbin/tienda-magico-deploy
sudo install -o root -g root -m 755 /tmp/vm-deploy.sh /tmp/update-runtime-env.sh /usr/local/lib/tienda-magico/
printf '%s\n' production | sudo tee /etc/tienda-magico/deploy-environment >/dev/null
sudo chown root:root /etc/tienda-magico/deploy-environment
sudo chmod 644 /etc/tienda-magico/deploy-environment
sudo visudo -f /etc/sudoers.d/tienda-magico-deploy
```

En staging, escribí `staging` en lugar de `production`. Dentro de `visudo`,
agregá solo esta línea, reemplazando `deploy` por el valor de `SSH_USER`:

```text
deploy ALL=(root) NOPASSWD: /usr/local/sbin/tienda-magico-deploy
```

Verificá con `sudo visudo -cf /etc/sudoers.d/tienda-magico-deploy`. Como
usuario de despliegue, ejecutá
`sudo -n /usr/local/sbin/tienda-magico-deploy invalid false`: debe rechazar la
etiqueta, sin pedir contraseña. No uses `NOPASSWD: ALL` ni guardes la
contraseña de sudo en GitHub. Revisá los scripts antes de actualizarlos en la
VM: el workflow solo transfiere configuración e imágenes, no reemplaza los
scripts privilegiados instalados.

## 2. Create a dedicated deployment SSH key

Generate a dedicated Ed25519 key on a trusted workstation. Do not add a
passphrase because GitHub Actions cannot answer an interactive prompt:

```bash
ssh-keygen -t ed25519 -C tienda-magico-staging-deploy -f tienda_staging_deploy
```

Append `tienda_staging_deploy.pub` to the deployment user's
`~/.ssh/authorized_keys` on the VM. Keep the private file secure; its complete
contents become the `SSH_PRIVATE_KEY` GitHub Environment secret.

Capture the VM's SSH host key from a trusted network and compare its fingerprint
with the VM/provider console before trusting it:

```bash
ssh-keyscan -H VM_HOST > tienda_staging_known_hosts
ssh-keygen -lf tienda_staging_known_hosts
```

For a nonstandard SSH port, use:

```bash
ssh-keyscan -p SSH_PORT -H VM_HOST > tienda_staging_known_hosts
```

The complete known-hosts file becomes the `SSH_KNOWN_HOSTS` secret. Requiring a
known host key prevents the deployment runner from silently accepting an
impersonated VM.

## 3. Configure the GitHub staging Environment

In the repository, open **Settings -> Environments**, create `staging`, and add
these Environment variables:

| Variable                  | Example                                                               | Purpose                                                  |
| ------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------- |
| `SHOP_URL`                | `https://shop.staging.example.org`                                    | Public storefront origin compiled into the image         |
| `CMS_URL`                 | `https://cms.staging.example.org`                                     | Public CMS origin compiled into both images              |
| `DEPLOY_PLATFORM`         | `linux/amd64`                                                         | Use `linux/arm64` when `uname -m` on the VM is `aarch64` |
| `SSH_HOST`                | `203.0.113.10`                                                        | VM DNS name or public IP                                 |
| `SSH_PORT`                | `22`                                                                  | Optional; defaults to 22                                 |
| `SSH_USER`                | `ubuntu`                                                              | Non-root deployment user                                 |
| `CHECKOUT_PROVIDER`       | `mercado-pago`                                                        | Staging checkout adapter                                 |
| `MERCADOPAGO_SANDBOX`     | `true`                                                                | Enables test payment behavior                            |
| `MERCADOPAGO_WEBHOOK_URL` | `https://shop.staging.example.org/api/checkout/webhooks/mercado-pago` | Public payment notification endpoint                     |

Add these Environment secrets:

| Secret                     | Contents                                                  |
| -------------------------- | --------------------------------------------------------- |
| `SSH_PRIVATE_KEY`          | Complete dedicated private key, including BEGIN/END lines |
| `SSH_KNOWN_HOSTS`          | Verified `known_hosts` entry for this VM and port         |
| `MERCADOPAGO_ACCESS_TOKEN` | Server-side Mercado Pago test access token                |
| `MERCADOPAGO_WEBHOOK_SECRET` | Webhook signing secret for the same application |

`SHOP_URL` and `CMS_URL` must be HTTP(S) origins without a trailing slash, path,
query, or fragment. They must match the URLs already configured on the VM.
`MERCADOPAGO_WEBHOOK_URL` must equal `SHOP_URL` followed by
`/api/checkout/webhooks/mercado-pago`.

The deployment sets `COMMERCE_PROVIDER=payload` and derives
`PAYLOAD_ECOMMERCE_URL`, `PAYLOAD_CMS_URL`, and `NEXT_PUBLIC_SITE_URL` from the
validated public URLs. It enforces `PAYLOAD_ECOMMERCE_CURRENCY=ARS` and
`PAYLOAD_ECOMMERCE_AMOUNT_IS_CENTS=true`. It also updates `CHECKOUT_PROVIDER`,
`MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`, `MERCADOPAGO_SANDBOX`, and
`MERCADOPAGO_WEBHOOK_URL` in the VM's `storefront.env`. All unmanaged values
remain unchanged. The previous runtime configuration and image tag are restored
automatically if activation fails.

## 4. First automated release

Commit the workflow, Dockerfiles, Payload migrations, and application changes.
Open a pull request whose base branch is `staging`, wait for its required checks,
and merge it. For an initial setup without branch protection, a direct push also
triggers the workflow:

```bash
git push origin staging
```

Follow **Actions -> Deploy staging**. A successful run will:

1. Validate all staging configuration.
2. Build the storefront and CMS for the VM architecture.
3. Pull matching PostgreSQL and Caddy images.
4. Export and verify `tienda-magico-TAG.tar`.
5. Copy the artifact, checksum, and current deployment kit over SSH.
6. Refresh Compose and Caddy files without overwriting runtime environment files.
7. Atomically update the GitHub-managed commerce and checkout runtime configuration.
8. Verify the checksum again on the VM.
9. Load and activate the immutable images.
10. Wait for the storefront and CMS health checks.
11. Verify the public storefront and CMS endpoints through DNS and HTTPS.
12. Print a deployment summary and remove the transferred tar archive.

Payload production migrations are bundled into the CMS image and run before CMS
initialization. A migration failure prevents the CMS health check from passing
and therefore fails the deployment.

For a concise operator checklist in Spanish, use
[`docs/deploy/staging-es.md`](staging-es.md).

## 5. Verify staging

Open the storefront and CMS admin URLs. On the VM, verify the release and
migration record when needed:

```bash
sudo docker compose \
  --env-file /opt/tienda-magico/deployment.env \
  -f /opt/tienda-magico/compose.yml ps

sudo docker compose \
  --env-file /opt/tienda-magico/deployment.env \
  -f /opt/tienda-magico/compose.yml \
  exec postgres \
  psql -U postgres -d tienda_magico_cms \
  -c 'SELECT name, batch FROM payload_migrations ORDER BY id;'
```

## Rollback

Open **Actions -> Deploy staging -> Run workflow** and enter a previously
deployed tag in `existing_tag`. The workflow skips the build and tells the VM to
activate that tag.

Rollback requires both `tienda-magico/storefront:TAG` and
`tienda-magico/cms:TAG` to remain in the VM's local Docker image store. Database
migrations are forward-running; rolling back application images does not
automatically run a migration's `down` function. Back up PostgreSQL and uploaded
media before risky schema releases.
