# GCE same-VM deploy

Deploy the **storefront** and **Payload CMS** on one Google Cloud VM.

```bash
sudo ./deploy.sh bootstrap
sudo ./deploy.sh configure --shop-host shop.example.com --cms-host cms.example.com
# edit /etc/tienda-magico/*.env
sudo ./deploy.sh db-up
sudo ./deploy.sh deploy
```

Full documentation: **[docs/deploy/gce.md](../../docs/deploy/gce.md)**
