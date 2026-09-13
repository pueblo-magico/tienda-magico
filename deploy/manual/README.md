# Manual artifact deployment

This is the simplest supported staging deployment when application images are
built on a Windows workstation and copied directly to a Linux VM. It does not
use GitHub Actions, a container registry, nginx, or Certbot.

The VM runs four containers with Docker Compose:

```text
Internet :80/:443
        |
      Caddy  (automatic HTTPS)
       |  |
       |  +--> Payload CMS :4000 --> PostgreSQL :5432
       +-----> Storefront :3000
```

Only Caddy publishes host ports. PostgreSQL, the CMS, and the storefront stay
on the private Compose network. Database files and CMS uploads persist under
`/var/lib/tienda-magico`.

## 1. Requirements

Local Windows machine:

- Docker Desktop running Linux containers
- PowerShell 5.1 or newer
- SSH/SCP access to the VM
- This repository checked out locally

Linux VM:

- Ubuntu or Debian
- At least 2 CPU cores and 4 GB RAM recommended
- At least 30 GB disk
- Public TCP ports 80 and 443 open
- A non-root user with `sudo`

For an Oracle Ampere A1 VM use `linux/arm64`. For an ordinary Intel/AMD VM use
`linux/amd64`. Check an existing VM with `uname -m`: `aarch64` means ARM64 and
`x86_64` means AMD64.

## 2. Prepare DNS

Create two public DNS A records pointing to the VM's public IP:

```text
staging-shop.example.com  -> VM_PUBLIC_IP
staging-cms.example.com   -> VM_PUBLIC_IP
```

Replace these examples with domains you control. Confirm both names resolve
before activation. Caddy obtains and renews HTTPS certificates automatically.

If DNS cannot be prepared yet, see **Temporary IP-only testing** below.

## 3. Choose a release tag

Every artifact should have a unique immutable tag. From the repository root in
PowerShell:

```powershell
$Tag = "staging-$(Get-Date -Format yyyyMMdd-HHmm)"
$ShopUrl = "https://staging-shop.example.com"
$CmsUrl = "https://staging-cms.example.com"
```

Do not reuse a tag for changed code. Unique tags make rollback deterministic.

## 4. Build the complete artifact on Windows

Oracle Ampere A1:

```powershell
npm run build-artifact -- `
  --tag $Tag `
  --shop-url $ShopUrl `
  --cms-url $CmsUrl `
  --platform linux/arm64
```

Intel/AMD VM:

```powershell
npm run build-artifact -- `
  --tag $Tag `
  --shop-url $ShopUrl `
  --cms-url $CmsUrl `
  --platform linux/amd64
```

The script builds the storefront and CMS, downloads matching PostgreSQL and
Caddy images, and exports all four into:

```text
artifacts/manual/tienda-magico-TAG.tar
artifacts/manual/tienda-magico-TAG.tar.sha256
```

Cross-architecture ARM builds on an AMD64 Windows computer use emulation and can
take considerably longer than native builds.

## 5. Copy the artifact and deployment kit

Set your SSH destination:

```powershell
$Vm = "ubuntu@VM_PUBLIC_IP"
```

Copy the image artifact, checksum, and deployment kit:

```powershell
scp ".\artifacts\manual\tienda-magico-$Tag.tar" "${Vm}:/tmp/"
scp ".\artifacts\manual\tienda-magico-$Tag.tar.sha256" "${Vm}:/tmp/"
scp -r .\deploy\manual "${Vm}:/tmp/tienda-manual"
```

If the VM uses a provider-specific SSH gateway, replace these commands with its
SCP equivalent. For example, GCE may require `gcloud compute scp` with
`--tunnel-through-iap`.

## 6. Verify and install the VM

Connect:

```powershell
ssh $Vm
```

On the VM, verify the artifact:

```bash
cd /tmp
sha256sum -c "tienda-magico-TAG.tar.sha256"
```

Replace `TAG` with the release tag. The result must say `OK`.

Run the one-time installation:

```bash
sudo bash /tmp/tienda-manual/vm-deploy.sh install
```

This installs Docker when necessary and creates:

```text
/opt/tienda-magico/compose.yml
/opt/tienda-magico/Caddyfile
/opt/tienda-magico/deployment.env
/opt/tienda-magico/env/*.env
/var/lib/tienda-magico/postgres
/var/lib/tienda-magico/media
```

Existing environment files are never overwritten by `install`.

## 7. Generate secrets

Generate a URL-safe database password and a Payload secret on the VM:

```bash
openssl rand -hex 32
openssl rand -base64 48
```

Store them in a password manager. The first value must be used in both
`postgres.env` and the CMS `DATABASE_URL`.

## 8. Configure the deployment

Edit the deployment settings:

```bash
sudo nano /opt/tienda-magico/deployment.env
```

Set:

```dotenv
SHOP_HOST=staging-shop.example.com
CMS_HOST=staging-cms.example.com
TIENDA_IMAGE_TAG=TAG
```

Edit PostgreSQL:

```bash
sudo nano /opt/tienda-magico/env/postgres.env
```

```dotenv
POSTGRES_USER=postgres
POSTGRES_PASSWORD=THE_GENERATED_DATABASE_PASSWORD
POSTGRES_DB=tienda_magico_cms
```

Edit the CMS:

```bash
sudo nano /opt/tienda-magico/env/cms.env
```

At minimum, replace the database password, Payload secret, CMS URL, and shop
origin. The database connection must remain:

```dotenv
DATABASE_URL=postgresql://postgres:THE_GENERATED_DATABASE_PASSWORD@postgres:5432/tienda_magico_cms
```

Edit the storefront:

```bash
sudo nano /opt/tienda-magico/env/storefront.env
```

Replace every example domain. Add a Mercado Pago test access token if checkout
will be tested:

```dotenv
MERCADOPAGO_ACCESS_TOKEN=YOUR_REAL_TEST_TOKEN
MERCADOPAGO_SANDBOX=true
```

The access token may be left empty until checkout testing, but checkout calls
will fail until a valid token is supplied.

When deployment runs through GitHub Actions, the workflow derives the Payload
commerce connection from `SHOP_URL` and `CMS_URL`. The staging Environment also
manages `CHECKOUT_PROVIDER`, `MERCADOPAGO_ACCESS_TOKEN`,
`MERCADOPAGO_SANDBOX`, and `MERCADOPAGO_WEBHOOK_URL`. The workflow updates only
those managed keys and preserves the remaining values in `storefront.env`.
Manual artifact deployments continue to use the values configured directly in
this file.

Environment files are installed with mode `600`. Keep all secrets out of Git
and out of the image build arguments.

## 9. Activate the first release

On the VM:

```bash
sudo bash /tmp/tienda-manual/vm-deploy.sh activate \
  --artifact "/tmp/tienda-magico-TAG.tar" \
  --tag "TAG"
```

The script:

1. Rejects missing files and unreplaced placeholders.
2. Loads all four images without using a registry.
3. Verifies the application images and tag.
4. Validates the Compose configuration.
5. Starts the stack and waits for health checks.

Caddy then obtains certificates for both domains. Open:

```text
https://staging-shop.example.com
https://staging-cms.example.com/admin
```

On first use, create the initial Payload administrator through the CMS page.

## 10. Inspect status and logs

```bash
sudo bash /tmp/tienda-manual/vm-deploy.sh status
sudo bash /tmp/tienda-manual/vm-deploy.sh logs
```

For live logs:

```bash
sudo docker compose \
  --env-file /opt/tienda-magico/deployment.env \
  -f /opt/tienda-magico/compose.yml \
  logs -f --tail=100
```

Press `Ctrl+C` to stop following logs; the containers continue running.

## 11. Deploy an update

Build locally with a new tag, copy its tar and checksum, then run:

```bash
cd /tmp
sha256sum -c "tienda-magico-NEW_TAG.tar.sha256"
sudo bash /tmp/tienda-manual/vm-deploy.sh activate \
  --artifact "/tmp/tienda-magico-NEW_TAG.tar" \
  --tag "NEW_TAG"
```

Configuration and persistent data are retained. After verification, remove the
transferred tar to reclaim disk space:

```bash
rm "/tmp/tienda-magico-NEW_TAG.tar" "/tmp/tienda-magico-NEW_TAG.tar.sha256"
```

The loaded Docker images remain available for rollback.

## 12. Roll back

List retained application images:

```bash
sudo docker image ls 'tienda-magico/*'
```

Activate a previous tag without an artifact:

```bash
sudo bash /tmp/tienda-manual/vm-deploy.sh activate --tag "PREVIOUS_TAG"
```

This changes only the application release. It does not roll back database
content or CMS uploads.

## 13. Back up persistent data

At minimum, back up PostgreSQL and CMS media before important changes. Create a
consistent database dump:

```bash
sudo mkdir -p /var/backups/tienda-magico
sudo docker compose \
  --env-file /opt/tienda-magico/deployment.env \
  -f /opt/tienda-magico/compose.yml \
  exec -T postgres pg_dump -U postgres tienda_magico_cms \
  | sudo tee /var/backups/tienda-magico/database.sql >/dev/null
```

Back up media and configuration:

```bash
sudo tar -czf /var/backups/tienda-magico/media-and-config.tar.gz \
  /var/lib/tienda-magico/media \
  /opt/tienda-magico
```

Copy backups off the VM. A backup stored only on the same VM is not sufficient.

## Temporary IP-only testing

Automatic public HTTPS requires domains. For short-lived IP-only testing,
replace `/opt/tienda-magico/Caddyfile` with:

```caddyfile
:80 {
    reverse_proxy storefront:3000
}
```

This exposes only the storefront over unencrypted HTTP and does not provide a
separate public CMS hostname. For a realistic staging environment—including
CMS access, cookies, images, and payment webhooks—use the two-domain HTTPS setup.

## Firewall summary

Allow inbound:

- TCP 22 from trusted administrator addresses, or use the provider's SSH tunnel
- TCP 80 from the internet
- TCP 443 from the internet
- UDP 443 optionally for HTTP/3

Do not expose ports 3000, 4000, 5432, or 5433.
