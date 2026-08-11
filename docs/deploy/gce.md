# Deploy on Google Cloud VMs

Production layout for **storefront** (Next.js :3000) and **Payload CMS** (Next.js :4000) plus **Postgres** (Docker on `127.0.0.1:5433`), fronted by **nginx**.

Scripts live in [`deploy/gce/`](../../deploy/gce/).

You can run **everything on one VM** (`--role all`, default) or **split backend and storefront across two VMs** (`--role cms` + `--role web`).

---

## Topologies

### Same VM (`--role all`)

```text
Internet
   │
   ▼
nginx :80/:443
   ├─ shop.example.com  → 127.0.0.1:3000   storefront
   └─ cms.example.com   → 127.0.0.1:4000   Payload admin + API
Postgres (Docker)       → 127.0.0.1:5433   (not public)
```

### Split VMs (`--role cms` + `--role web`)

```text
Internet
   │
   ├─► shop VM (role=web)
   │     nginx :80/:443
   │       shop.example.com → 127.0.0.1:3000  storefront
   │     storefront calls public CMS URL over HTTPS
   │
   └─► cms VM (role=cms)
         nginx :80/:443
           cms.example.com → 127.0.0.1:4000  Payload admin + API
         Postgres (Docker) → 127.0.0.1:5433  (loopback only on cms VM)
```

Cross-VM requirements:

| Concern | Setting |
| --- | --- |
| Storefront → CMS API / media | `PAYLOAD_ECOMMERCE_URL` / `PAYLOAD_CMS_URL` = public CMS origin (`https://cms.example.com`) |
| CMS CORS | `CORS_ORIGINS` must include the exact shop origin (`https://shop.example.com`) |
| DNS | Separate `A` records: shop host → web VM, cms host → cms VM |
| Builds | Each VM only builds what it runs (`web` skips CMS build; `cms` skips storefront build) |

Postgres stays on the **cms** VM and is **not** exposed to the storefront VM (Payload is the only DB client).

---

## Prerequisites

| Piece | Notes |
| --- | --- |
| GCP project | Billing enabled |
| Compute Engine VM(s) | Ubuntu 22.04/24.04 LTS; one VM for `all`, or two for split |
| External IP(s) | Or HTTPS load balancer in front |
| DNS | `A` records for shop and/or CMS hosts → correct VM (or LB) |
| Firewall (VPC) | Allow `tcp:22`, `tcp:80`, `tcp:443` to the VM(s) |
| Local tools (optional) | `gcloud` CLI authenticated, for `remote` commands |
| GitHub access | Deploy key or HTTPS token if the VM pulls from git |

Sizing:

| Role | Suggested | Why |
| --- | --- | --- |
| `all` | 2 vCPU / 4–8 GB, 30 GB+ disk | Both Next builds are memory-heavy |
| `cms` | 2 vCPU / 4 GB, 30 GB+ disk | CMS build + Postgres |
| `web` | 2 vCPU / 4 GB, 20 GB+ disk | Storefront build only (no Docker) |

---

## Roles

```bash
sudo ./deploy/gce/deploy.sh <command> --role all|cms|web
```

| `--role` | Packages | systemd | nginx | env files | `db-up` |
| --- | --- | --- | --- | --- | --- |
| `all` | Node, Docker, nginx | web + cms | shop + cms vhosts | storefront + cms + postgres | yes |
| `cms` | Node, Docker, nginx | cms only | cms vhost | cms + postgres | yes |
| `web` | Node, nginx (no Docker) | web only | shop vhost | storefront | no |

After `bootstrap` or `configure`, the role is written to `/etc/tienda-magico/role`. Later commands on that VM reuse it if you omit `--role`.

Aliases accepted: `backend` → `cms`, `frontend` / `storefront` → `web`.

---

## Quick start — same VM

```bash
gcloud compute ssh INSTANCE --zone=ZONE --project=PROJECT

sudo mkdir -p /opt/tienda-magico
sudo chown $USER:$USER /opt/tienda-magico
git clone git@github.com:itsJASPERr/tienda-magico.git /opt/tienda-magico
cd /opt/tienda-magico

sudo ./deploy/gce/deploy.sh bootstrap
sudo ./deploy/gce/deploy.sh configure \
  --shop-host shop.example.com \
  --cms-host cms.example.com

sudo nano /etc/tienda-magico/cms.env
sudo nano /etc/tienda-magico/storefront.env
# postgres password is auto-generated in /etc/tienda-magico/postgres.env

sudo ./deploy/gce/deploy.sh db-up
sudo ./deploy/gce/deploy.sh deploy
./deploy/gce/deploy.sh status
```

---

## Quick start — split VMs

Use **two** instances (example names `tm-cms` and `tm-web`). DNS: `cms.example.com` → cms VM, `shop.example.com` → web VM.

### 1) Backend VM (`tm-cms`)

```bash
gcloud compute ssh tm-cms --zone=ZONE --project=PROJECT

sudo mkdir -p /opt/tienda-magico && sudo chown $USER:$USER /opt/tienda-magico
git clone git@github.com:itsJASPERr/tienda-magico.git /opt/tienda-magico
cd /opt/tienda-magico

sudo ./deploy/gce/deploy.sh bootstrap --role cms
sudo ./deploy/gce/deploy.sh configure --role cms \
  --cms-host cms.example.com \
  --shop-host shop.example.com

sudo nano /etc/tienda-magico/cms.env
# Required:
#   PAYLOAD_SECRET=...
#   NEXT_PUBLIC_SERVER_URL=https://cms.example.com
#   PAYLOAD_PUBLIC_SERVER_URL=https://cms.example.com
#   CORS_ORIGINS=https://shop.example.com
# DATABASE_URL password is filled from postgres.env on db-up if still CHANGE_ME_STRONG_PASSWORD

sudo ./deploy/gce/deploy.sh db-up
sudo ./deploy/gce/deploy.sh deploy
./deploy/gce/deploy.sh status
```

Open `http://cms.example.com/admin` and create the first admin user.

### 2) Storefront VM (`tm-web`)

```bash
gcloud compute ssh tm-web --zone=ZONE --project=PROJECT

sudo mkdir -p /opt/tienda-magico && sudo chown $USER:$USER /opt/tienda-magico
git clone git@github.com:itsJASPERr/tienda-magico.git /opt/tienda-magico
cd /opt/tienda-magico

sudo ./deploy/gce/deploy.sh bootstrap --role web
sudo ./deploy/gce/deploy.sh configure --role web \
  --shop-host shop.example.com \
  --cms-host cms.example.com

sudo nano /etc/tienda-magico/storefront.env
# Required:
#   NEXT_PUBLIC_SITE_URL=https://shop.example.com
#   COMMERCE_PROVIDER=payload
#   PAYLOAD_ECOMMERCE_URL=https://cms.example.com
#   MERCADOPAGO_ACCESS_TOKEN=...

sudo ./deploy/gce/deploy.sh deploy
./deploy/gce/deploy.sh status
```

There is **no** `db-up` on the web VM.

### Order matters

1. Bring CMS + Postgres up first (admin user, publish catalog).
2. Point storefront env at the **public** CMS URL.
3. Deploy storefront (rebuild if you change any `NEXT_PUBLIC_*`).

---

## Script reference

```bash
sudo ./deploy/gce/deploy.sh <command> [options]
```

| Command | Root? | Description |
| --- | --- | --- |
| `bootstrap` | yes | Install packages for role (Node; Docker only for `cms`/`all`; nginx; `tienda` user; UFW) |
| `configure` | yes | systemd unit(s), nginx vhost(s), env templates for role; persist `/etc/tienda-magico/role` |
| `db-up` | yes | Start Postgres compose (`127.0.0.1:5433`) — **cms/all only** |
| `deploy` | yes | Pull/sync code, `npm ci`, build role app(s), restart unit(s) |
| `restart` | yes | Restart role unit(s) only |
| `status` | no* | systemd + local HTTP checks for role |
| `logs [web\|cms\|all]` | no* | `journalctl -f` (defaults to role) |
| `remote <cmd>` | no | Run via `gcloud compute ssh` / `scp` from your laptop |

\* `status` / `logs` need permission to talk to systemd/journal.

### Useful options

| Flag | Default | Purpose |
| --- | --- | --- |
| `--role` | `all` (or `$TM_ENV_DIR/role`) | `all` \| `cms` \| `web` |
| `--app-dir` | `/opt/tienda-magico` | Application root |
| `--env-dir` | `/etc/tienda-magico` | Env files + persisted role |
| `--shop-host` | `shop.example.com` | nginx `server_name` + env seeding |
| `--cms-host` | `cms.example.com` | nginx `server_name` + env seeding |
| `--branch` | `main` | Git branch when pulling |
| `--git-url` | — | Clone if app dir empty |
| `--skip-build` | off | Restart only |
| `--skip-nginx` | off | Do not touch nginx during configure |
| `--project` / `--zone` / `--instance` | — | For `remote` |

---

## Environment files

Created by `configure` (mode `640`, not committed). `postgres.env` is also auto-created by `db-up` if missing.

| File | Roles | Used by |
| --- | --- | --- |
| `/etc/tienda-magico/role` | all | Persisted deploy role |
| `/etc/tienda-magico/storefront.env` | `web`, `all` | systemd `tienda-magico-web` + app `.env.local` / `.env.production.local` |
| `/etc/tienda-magico/cms.env` | `cms`, `all` | systemd `tienda-magico-cms` + `apps/cms/.env` |
| `/etc/tienda-magico/postgres.env` | `cms`, `all` | Docker Compose Postgres |

Templates: [`deploy/gce/env/`](../../deploy/gce/env/).

### Minimum CMS values (`cms` / `all`)

```bash
DATABASE_URL=postgresql://postgres:CHANGE_ME_STRONG_PASSWORD@127.0.0.1:5433/tienda_magico_cms
PAYLOAD_SECRET=<openssl rand -base64 48>
NEXT_PUBLIC_SERVER_URL=https://cms.example.com
PAYLOAD_PUBLIC_SERVER_URL=https://cms.example.com
CORS_ORIGINS=https://shop.example.com
```

`db-up` creates `postgres.env` when absent and rewrites `CHANGE_ME_STRONG_PASSWORD` in `cms.env` when still present.

On a **split** deploy, `CORS_ORIGINS` must list the storefront’s public origin (scheme + host, no trailing slash). Multiple origins: comma-separated.

### Minimum storefront values (`web` / `all`)

```bash
NEXT_PUBLIC_SITE_URL=https://shop.example.com
COMMERCE_PROVIDER=payload
PAYLOAD_ECOMMERCE_URL=https://cms.example.com
CHECKOUT_PROVIDER=mercado-pago
MERCADOPAGO_ACCESS_TOKEN=...
MERCADOPAGO_SANDBOX=false
```

On a **split** deploy, `PAYLOAD_ECOMMERCE_URL` must be the **public** CMS URL (not `127.0.0.1`). Optionally set `PAYLOAD_CMS_URL` the same way for homepage content.

**Important:** `NEXT_PUBLIC_*` vars are inlined at **build** time. After changing them, run a full `deploy` (not `--skip-build`).

Checkout credentials: [checkout operations](../checkout/operations.md).

---

## Remote deploy from your laptop

Pass `--role` and target the correct `--instance` for each VM.

```bash
# --- CMS VM ---
./deploy/gce/deploy.sh remote bootstrap --role cms \
  --project my-gcp --zone us-central1-a --instance tm-cms

./deploy/gce/deploy.sh remote sync-code \
  --project my-gcp --zone us-central1-a --instance tm-cms

./deploy/gce/deploy.sh remote configure --role cms \
  --project my-gcp --zone us-central1-a --instance tm-cms \
  --shop-host shop.example.com --cms-host cms.example.com

# SSH once to edit secrets on cms VM:
./deploy/gce/deploy.sh remote ssh \
  --project my-gcp --zone us-central1-a --instance tm-cms
# sudo nano /etc/tienda-magico/cms.env

./deploy/gce/deploy.sh remote db-up --role cms \
  --project my-gcp --zone us-central1-a --instance tm-cms

./deploy/gce/deploy.sh remote deploy --role cms \
  --project my-gcp --zone us-central1-a --instance tm-cms

# --- storefront VM ---
./deploy/gce/deploy.sh remote bootstrap --role web \
  --project my-gcp --zone us-central1-a --instance tm-web

./deploy/gce/deploy.sh remote sync-code \
  --project my-gcp --zone us-central1-a --instance tm-web

./deploy/gce/deploy.sh remote configure --role web \
  --project my-gcp --zone us-central1-a --instance tm-web \
  --shop-host shop.example.com --cms-host cms.example.com

./deploy/gce/deploy.sh remote ssh \
  --project my-gcp --zone us-central1-a --instance tm-web
# sudo nano /etc/tienda-magico/storefront.env

./deploy/gce/deploy.sh remote deploy --role web \
  --project my-gcp --zone us-central1-a --instance tm-web
```

Same-VM remote: omit `--role` (or `--role all`) and use one instance.

Git-based alternative on each VM (no `sync-code`): clone into `/opt/tienda-magico`, then `deploy` pulls `--branch main`.

---

## systemd units

| Unit | Role | Working directory | Start |
| --- | --- | --- | --- |
| `tienda-magico-web.service` | `web`, `all` | `/opt/tienda-magico` | `npm run start:web` (:3000) |
| `tienda-magico-cms.service` | `cms`, `all` | `/opt/tienda-magico/apps/cms` | `npm run start` (:4000) |

`configure` enables units for the role and disables the other if it was previously installed.

```bash
sudo systemctl status tienda-magico-web tienda-magico-cms
sudo journalctl -u tienda-magico-cms -u tienda-magico-web -f
```

Assets: [`deploy/gce/systemd/`](../../deploy/gce/systemd/).

---

## nginx

| Template | Installed as | Role |
| --- | --- | --- |
| [`nginx/storefront.conf`](../../deploy/gce/nginx/storefront.conf) | `tienda-magico-web.conf` | `web`, `all` |
| [`nginx/cms.conf`](../../deploy/gce/nginx/cms.conf) | `tienda-magico-cms.conf` | `cms`, `all` |
| [`nginx/tienda-magico.conf`](../../deploy/gce/nginx/tienda-magico.conf) | legacy combined fallback | — |

### TLS (Let's Encrypt)

After DNS points at the right VM(s):

```bash
# On each VM, only the hostnames that resolve here:
sudo apt-get install -y certbot python3-certbot-nginx
# cms VM:
sudo certbot --nginx -d cms.example.com
# web VM:
sudo certbot --nginx -d shop.example.com
# same-VM:
sudo certbot --nginx -d shop.example.com -d cms.example.com
```

Or terminate TLS on a **GCP HTTPS External Load Balancer** and keep nginx on HTTP internally.

Update public URLs in env files to `https://…` and **rebuild** the storefront (and CMS if `NEXT_PUBLIC_SERVER_URL` changed).

---

## Postgres

Compose file: [`deploy/gce/docker-compose.postgres.yml`](../../deploy/gce/docker-compose.postgres.yml)

- Image: `postgres:16-alpine`
- Bind: **`127.0.0.1:5433` only** on the **cms** (or `all`) VM
- Volume: Docker named volume `tm_cms_pgdata`
- Not used on `--role web`

```bash
sudo ./deploy/gce/deploy.sh db-up   # cms|all only
docker ps
```

Backups (example, on cms VM):

```bash
docker exec -t $(docker ps -qf name=postgres) \
  pg_dump -U postgres tienda_magico_cms | gzip > cms-$(date +%F).sql.gz
```

---

## Updates / redeploy

```bash
# On each VM (role is read from /etc/tienda-magico/role if omitted):
cd /opt/tienda-magico
sudo ./deploy/gce/deploy.sh deploy
# or without rebuild:
sudo ./deploy/gce/deploy.sh deploy --skip-build
```

Media uploads persist under `apps/cms/media` on the **cms** VM (deploy rsync excludes wiping remote media when syncing from laptop; git pull keeps the directory).

---

## GCP checklist

### Shared

- [ ] VPC firewall: 22, 80, 443
- [ ] TLS via certbot or HTTPS LB
- [ ] Snapshot / scheduled disk backups
- [ ] Restrict SSH source ranges if possible

### Same VM

- [ ] One Ubuntu LTS VM, static IP optional
- [ ] DNS `shop` + `cms` → that IP
- [ ] `bootstrap` → `configure` → edit env → `db-up` → `deploy`
- [ ] CMS first user at `/admin`
- [ ] Storefront reaches CMS; Mercado Pago token set

### Split VMs

- [ ] `tm-cms` and `tm-web` (or equivalent) created
- [ ] DNS `cms` → cms VM, `shop` → web VM
- [ ] CMS VM: `bootstrap --role cms` → `configure` → edit `cms.env` → `db-up` → `deploy`
- [ ] CMS first user + published products / home page
- [ ] Web VM: `bootstrap --role web` → `configure` → edit `storefront.env` → `deploy`
- [ ] `CORS_ORIGINS` on CMS includes shop origin
- [ ] `PAYLOAD_ECOMMERCE_URL` on storefront is public CMS HTTPS URL
- [ ] Mercado Pago production token + `NEXT_PUBLIC_SITE_URL=https://shop…`

### Create VMs example (split)

```bash
for name in tm-cms tm-web; do
  gcloud compute instances create "$name" \
    --project=my-gcp \
    --zone=us-central1-a \
    --machine-type=e2-medium \
    --image-family=ubuntu-2404-lts-amd64 \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=40GB \
    --tags=http-server,https-server \
    --scopes=cloud-platform
done

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
| Missing `postgres.env` on `db-up` | `configure --role cms` (or `all`) first, or re-run `db-up` (seeds file). Same `--env-dir`? |
| `db-up` on web VM | Expected failure — Postgres only on `cms`/`all` |
| Wrong unit started / missing | `cat /etc/tienda-magico/role`; re-run `configure --role …` |
| Storefront cannot reach CMS (split) | Public `PAYLOAD_ECOMMERCE_URL`; CMS up; firewall 80/443 on cms VM; CORS |
| CORS errors in browser | `CORS_ORIGINS` must include exact shop origin (scheme + host) |
| `deploy` OOM during build | Larger machine or add swap; CMS build uses high Node heap |
| CMS boot loop | `journalctl -u tienda-magico-cms`; `DATABASE_URL`; Postgres (`db-up`, `docker ps`) |
| Storefront empty catalog | CMS URL, CORS, products **published**, `COMMERCE_PROVIDER=payload` |
| nginx 502 | App not listening: `status`, `ss -lntp \| grep -E '3000\|4000'` |
| Wrong public links / MP return | `NEXT_PUBLIC_SITE_URL` + rebuild |
| Media 404 from shop | CMS public URL; storefront `images.remotePatterns` includes CMS host |
| Permission denied on media | `chown -R tienda:tienda /opt/tienda-magico/apps/cms/media` (cms VM) |

```bash
# on web VM / same-VM
curl -sS http://127.0.0.1:3000/api/checkout
# on cms VM / same-VM
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4000/admin
# from storefront VM to public CMS
curl -sS -o /dev/null -w '%{http_code}\n' https://cms.example.com/admin
sudo nginx -t && sudo systemctl reload nginx
```

---

## File map

| Path | Role |
| --- | --- |
| `deploy/gce/deploy.sh` | Main entry (`--role all\|cms\|web`) |
| `deploy/gce/docker-compose.postgres.yml` | Production Postgres (cms VM) |
| `deploy/gce/systemd/*.service` | web + cms units |
| `deploy/gce/nginx/storefront.conf` | Shop vhost template |
| `deploy/gce/nginx/cms.conf` | CMS vhost template |
| `deploy/gce/nginx/tienda-magico.conf` | Legacy combined reference |
| `deploy/gce/env/*.env.example` | Env templates |

---

## Related

- [CMS app README](../../apps/cms/README.md) — local CMS + deploy notes
- [Checkout operations](../checkout/operations.md) — Mercado Pago on production
- [Commerce / Payload adapter](../commerce/payload-ecommerce.md)
- [Docs home](../README.md)
