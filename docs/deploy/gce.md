# Deploy on a Google Cloud VM

Same-VM production layout for **storefront** (Next.js :3000) and **Payload CMS** (Next.js :4000) plus **Postgres** (Docker on `127.0.0.1:5433`), fronted by **nginx**.

Scripts live in [`deploy/gce/`](../../deploy/gce/).

```text
Internet
   │
   ▼
nginx :80/:443
   ├─ shop.example.com  → 127.0.0.1:3000   storefront
   └─ cms.example.com   → 127.0.0.1:4000   Payload admin + API
Postgres (Docker)       → 127.0.0.1:5433   (not public)
```

---

## Prerequisites

| Piece | Notes |
| --- | --- |
| GCP project | Billing enabled |
| Compute Engine VM | e.g. `e2-medium` or larger, Ubuntu 22.04/24.04 LTS |
| External IP | Or HTTPS load balancer in front |
| DNS | `A` records for shop + CMS hosts → VM (or LB) |
| Firewall (VPC) | Allow `tcp:22`, `tcp:80`, `tcp:443` to the VM |
| Local tools (optional) | `gcloud` CLI authenticated, for `remote` commands |
| GitHub access | Deploy key or HTTPS token if the VM pulls from git |

Recommended machine: **2 vCPU / 4–8 GB RAM** (Next builds are memory-heavy). Disk **30 GB+**.

---

## Quick start (on the VM)

```bash
# 1) SSH into the VM
gcloud compute ssh INSTANCE --zone=ZONE --project=PROJECT

# 2) Get the code
sudo mkdir -p /opt/tienda-magico
sudo chown $USER:$USER /opt/tienda-magico
git clone https://github.com/itsJASPERr/tienda-magico.git /opt/tienda-magico
cd /opt/tienda-magico

# 3) One-time OS packages (Node 22, Docker, nginx, app user)
sudo ./deploy/gce/deploy.sh bootstrap

# 4) systemd + nginx + env templates
sudo ./deploy/gce/deploy.sh configure \
  --shop-host shop.example.com \
  --cms-host cms.example.com

# 5) Edit secrets (required)
sudo nano /etc/tienda-magico/cms.env
sudo nano /etc/tienda-magico/storefront.env
# postgres password is auto-generated in /etc/tienda-magico/postgres.env

# 6) Database + build + start
sudo ./deploy/gce/deploy.sh db-up
sudo ./deploy/gce/deploy.sh deploy

# 7) Health
./deploy/gce/deploy.sh status
```

Open:

- Storefront: `http://shop.example.com` (or VM IP with Host header / temporary DNS)
- CMS admin: `http://cms.example.com/admin` — create the first admin user

---

## Script reference

```bash
sudo ./deploy/gce/deploy.sh <command> [options]
```

| Command | Root? | Description |
| --- | --- | --- |
| `bootstrap` | yes | Install Node.js, Docker, nginx, `tienda` user, basic UFW |
| `configure` | yes | Install systemd units, nginx vhosts, seed env files |
| `db-up` | yes | Start Postgres compose (`127.0.0.1:5433`) |
| `deploy` | yes | Pull/sync code, `npm ci`, build CMS + web, restart units |
| `restart` | yes | Restart CMS + storefront only |
| `status` | no* | systemd + local HTTP checks |
| `logs [web\|cms\|all]` | no* | `journalctl -f` |
| `remote <cmd>` | no | Run via `gcloud compute ssh` / `scp` from your laptop |

\* `status` / `logs` need permission to talk to systemd/journal (often passwordless for the deploying user).

### Useful options

| Flag | Default | Purpose |
| --- | --- | --- |
| `--app-dir` | `/opt/tienda-magico` | Application root |
| `--env-dir` | `/etc/tienda-magico` | Env files |
| `--shop-host` | `shop.example.com` | nginx `server_name` + env seeding |
| `--cms-host` | `cms.example.com` | nginx `server_name` + env seeding |
| `--branch` | `main` | Git branch when pulling |
| `--git-url` | — | Clone if app dir empty |
| `--skip-build` | off | Restart only |
| `--project` / `--zone` / `--instance` | — | For `remote` |

---

## Environment files

Created by `configure` (mode `640`, not committed). `postgres.env` is also auto-created by `db-up` if missing.

| File | Used by |
| --- | --- |
| `/etc/tienda-magico/storefront.env` | systemd `tienda-magico-web` + copied to app `.env.local` / `.env.production.local` |
| `/etc/tienda-magico/cms.env` | systemd `tienda-magico-cms` + copied to `apps/cms/.env` |
| `/etc/tienda-magico/postgres.env` | Docker Compose Postgres (`db-up`) |

Templates: [`deploy/gce/env/`](../../deploy/gce/env/).

### Minimum CMS values

```bash
DATABASE_URL=postgresql://postgres:FROM_POSTGRES_ENV@127.0.0.1:5433/tienda_magico_cms
PAYLOAD_SECRET=<openssl rand -base64 48>
NEXT_PUBLIC_SERVER_URL=https://cms.example.com
PAYLOAD_PUBLIC_SERVER_URL=https://cms.example.com
CORS_ORIGINS=https://shop.example.com
```

`db-up` creates `postgres.env` when absent (generated password) and rewrites `CHANGE_ME_STRONG_PASSWORD` in `cms.env` from that file when still present. Prefer running `configure` first so all three env files exist before you edit secrets.

### Minimum storefront values

```bash
NEXT_PUBLIC_SITE_URL=https://shop.example.com
COMMERCE_PROVIDER=payload
PAYLOAD_ECOMMERCE_URL=https://cms.example.com
CHECKOUT_PROVIDER=mercado-pago
MERCADOPAGO_ACCESS_TOKEN=...
MERCADOPAGO_SANDBOX=false
```

**Important:** `NEXT_PUBLIC_*` vars are inlined at **build** time. After changing them, run a full `deploy` (not `--skip-build`).

Checkout credentials: [checkout operations](../checkout/operations.md).

---

## Remote deploy from your laptop

```bash
# One-time: bootstrap OS on the empty VM (uploads deploy/gce only)
./deploy/gce/deploy.sh remote bootstrap \
  --project my-gcp --zone us-central1-a --instance tm-prod

# Push application tarball (no .git / node_modules)
./deploy/gce/deploy.sh remote sync-code \
  --project my-gcp --zone us-central1-a --instance tm-prod

# Configure hosts + env templates
./deploy/gce/deploy.sh remote configure \
  --project my-gcp --zone us-central1-a --instance tm-prod \
  --shop-host shop.example.com --cms-host cms.example.com

# Then SSH once to edit secrets:
./deploy/gce/deploy.sh remote ssh \
  --project my-gcp --zone us-central1-a --instance tm-prod
# sudo nano /etc/tienda-magico/cms.env
# sudo nano /etc/tienda-magico/storefront.env

./deploy/gce/deploy.sh remote db-up \
  --project my-gcp --zone us-central1-a --instance tm-prod

./deploy/gce/deploy.sh remote deploy \
  --project my-gcp --zone us-central1-a --instance tm-prod
```

Git-based alternative on the VM (no `sync-code`): clone into `/opt/tienda-magico`, then `deploy` pulls `--branch main`.

---

## systemd units

| Unit | Working directory | Start |
| --- | --- | --- |
| `tienda-magico-web.service` | `/opt/tienda-magico` | `npm run start:web` (:3000) |
| `tienda-magico-cms.service` | `/opt/tienda-magico/apps/cms` | `npm run start` (:4000) |

```bash
sudo systemctl status tienda-magico-web tienda-magico-cms
sudo journalctl -u tienda-magico-cms -u tienda-magico-web -f
```

Assets: [`deploy/gce/systemd/`](../../deploy/gce/systemd/).

---

## nginx

Site file: [`deploy/gce/nginx/tienda-magico.conf`](../../deploy/gce/nginx/tienda-magico.conf)  
Installed as `/etc/nginx/sites-available/tienda-magico.conf`.

### TLS (Let's Encrypt)

After DNS points at the VM:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d shop.example.com -d cms.example.com
```

Or terminate TLS on a **GCP HTTPS External Load Balancer** and keep nginx on HTTP internally; set `X-Forwarded-Proto` accordingly (template already forwards `$scheme` — use `https` at the LB or enable certbot).

Update public URLs in both env files to `https://…` and **rebuild** the storefront.

---

## Postgres

Compose file: [`deploy/gce/docker-compose.postgres.yml`](../../deploy/gce/docker-compose.postgres.yml)

- Image: `postgres:16-alpine`
- Bind: **`127.0.0.1:5433` only** (not the public NIC)
- Volume: Docker named volume `tm_cms_pgdata`

```bash
sudo ./deploy/gce/deploy.sh db-up
docker ps
```

Backups (example):

```bash
docker exec -t $(docker ps -qf name=postgres) \
  pg_dump -U postgres tienda_magico_cms | gzip > cms-$(date +%F).sql.gz
```

---

## Updates / redeploy

```bash
cd /opt/tienda-magico
sudo ./deploy/gce/deploy.sh deploy
# or without rebuild:
sudo ./deploy/gce/deploy.sh deploy --skip-build
```

Media uploads persist under `apps/cms/media` (deploy rsync excludes wiping remote media when syncing from laptop; git pull keeps the directory).

---

## GCP checklist

- [ ] VM created (Ubuntu LTS), SSH works via OS Login or keys
- [ ] VPC firewall: 22, 80, 443
- [ ] Static external IP (optional but recommended)
- [ ] DNS `shop` + `cms` → IP
- [ ] `bootstrap` → `configure` → edit env → `db-up` → `deploy`
- [ ] CMS first user at `/admin`
- [ ] Publish at least one product + home page
- [ ] Storefront `COMMERCE_PROVIDER=payload` reaches CMS URL
- [ ] Mercado Pago production token + `NEXT_PUBLIC_SITE_URL=https://shop…`
- [ ] TLS via certbot or HTTPS LB
- [ ] Snapshot / scheduled disk backups
- [ ] Restrict SSH source ranges if possible

### Create VM example

```bash
gcloud compute instances create tm-prod \
  --project=my-gcp \
  --zone=us-central1-a \
  --machine-type=e2-medium \
  --image-family=ubuntu-2404-lts-amd64 \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=40GB \
  --tags=http-server,https-server \
  --scopes=cloud-platform

gcloud compute firewall-rules create allow-http-https \
  --allow=tcp:80,tcp:443 \
  --target-tags=http-server,https-server \
  --description="HTTP/S for tienda-magico" \
  --project=my-gcp
```

(`default-allow-ssh` usually already exists.)

---

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Missing `postgres.env` on `db-up` | Run `sudo ./deploy/gce/deploy.sh configure` first, or re-run `db-up` (it now seeds `postgres.env` under `--env-dir`, default `/etc/tienda-magico`). Confirm the same `--env-dir` for both commands. |
| `deploy` OOM during build | Larger machine or add swap; CMS build uses high Node heap |
| CMS boot loop | `journalctl -u tienda-magico-cms`; `DATABASE_URL`, Postgres up (`db-up`, `docker ps`) |
| Storefront empty catalog | CMS URL, CORS, products **published**, `COMMERCE_PROVIDER=payload` |
| CORS errors in browser | `CORS_ORIGINS` must include exact shop origin |
| nginx 502 | App not listening: `status`, `ss -lntp \| grep -E '3000\|4000'` |
| Wrong public links / MP return | `NEXT_PUBLIC_SITE_URL` + rebuild |
| Media 404 from shop | CMS public URL; storefront `images.remotePatterns` includes CMS host |
| Permission denied on media | `chown -R tienda:tienda /opt/tienda-magico/apps/cms/media` |

```bash
curl -sS http://127.0.0.1:3000/api/checkout
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4000/admin
sudo nginx -t && sudo systemctl reload nginx
```

---

## File map

| Path | Role |
| --- | --- |
| `deploy/gce/deploy.sh` | Main entry (bootstrap → deploy) |
| `deploy/gce/docker-compose.postgres.yml` | Production Postgres |
| `deploy/gce/systemd/*.service` | web + cms units |
| `deploy/gce/nginx/tienda-magico.conf` | Reverse proxy template |
| `deploy/gce/env/*.env.example` | Env templates |

---

## Related

- [CMS app README](../../apps/cms/README.md) — local CMS + same-VM sketch
- [Checkout operations](../checkout/operations.md) — Mercado Pago on production
- [Commerce / Payload adapter](../commerce/payload-ecommerce.md)
- [Docs home](../README.md)
