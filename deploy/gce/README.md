# GCE deploy (same-VM or split-VM)

Deploy the **storefront** and/or **Payload CMS** on Google Cloud VM(s).

## Roles

| `--role` | What runs on this VM |
| --- | --- |
| `all` (default) | Storefront + CMS + Postgres |
| `cms` | CMS + Postgres (backend) |
| `web` | Storefront only (frontend) |

Role is persisted to `/etc/tienda-magico/role` after `bootstrap` / `configure`.

## Same VM

```bash
sudo ./deploy.sh bootstrap
sudo ./deploy.sh configure --shop-host shop.example.com --cms-host cms.example.com
# edit /etc/tienda-magico/cms.env and storefront.env
sudo ./deploy.sh db-up
sudo ./deploy.sh deploy
```

## Split VMs

```bash
# --- backend VM ---
sudo ./deploy.sh bootstrap --role cms
sudo ./deploy.sh configure --role cms \
  --cms-host cms.example.com --shop-host shop.example.com
# edit /etc/tienda-magico/cms.env
sudo ./deploy.sh db-up
sudo ./deploy.sh deploy

# --- frontend VM ---
sudo ./deploy.sh bootstrap --role web
sudo ./deploy.sh configure --role web \
  --shop-host shop.example.com --cms-host cms.example.com
# edit /etc/tienda-magico/storefront.env (PAYLOAD_ECOMMERCE_URL → CMS URL)
sudo ./deploy.sh deploy
```

Full documentation: **[docs/deploy/gce.md](../../docs/deploy/gce.md)**
