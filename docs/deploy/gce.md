# Deploy to a Google Cloud VM

The supported production path is artifact-only deployment through GitHub
Actions. It replaces the older model of cloning the repository and compiling on
the VM.

```text
GitHub Actions
  ├─ builds immutable storefront + Payload images
  ├─ pushes them to Artifact Registry
  └─ connects to the VM through IAP and activates a commit-SHA tag

VM
  ├─ nginx :80/:443 → loopback storefront :3000 and CMS :4000
  ├─ Docker Compose runs images + local Postgres
  └─ persistent database and uploads live under /var/lib/tienda-magico
```

Use the full [staging and production deployment guide](github-actions.md) for
the required Google Cloud setup, identity federation, variables, secrets, DNS,
TLS, releases, and rollback.

## One-time VM preparation

Create an Ubuntu/Debian VM, attach a service account with
`roles/artifactregistry.reader` and the `cloud-platform` access scope, and
allow IAP SSH plus public HTTP/HTTPS. The workflow automatically uploads the
small operational bundle and runs its bootstrap/configure steps on first
deployment; no application source remains on the VM.

Before the first release, point the configured storefront and CMS DNS records at
the VM and issue TLS certificates with Certbot. The nginx template is in
[`deploy/gce/nginx/tienda-magico.conf`](../../deploy/gce/nginx/tienda-magico.conf).

## VM commands

The release activator is temporarily uploaded by the workflow. It supports:

```bash
sudo ./deploy.sh status
sudo ./deploy.sh activate --tag COMMIT_SHA
sudo ./deploy.sh rollback --tag PREVIOUS_COMMIT_SHA
```

`activate` obtains a short-lived token from the attached VM service account,
pulls both image artifacts, starts the compose stack, and waits for local health
checks. It does not run npm, Git, or a build.

## Persistent state

- Postgres: `/var/lib/tienda-magico/postgres`
- Payload media: `/var/lib/tienda-magico/media`
- Runtime configuration: `/etc/tienda-magico/*.env`

Back up the two data directories and protect the runtime configuration. Do not
put runtime credentials into Docker images or repository files.
