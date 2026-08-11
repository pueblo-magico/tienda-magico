# GCE artifact-only deployment

GitHub Actions builds and publishes immutable storefront and CMS images. The VM
only holds those images, Docker Compose configuration, nginx, database data, and
Payload uploads—never a Git checkout or Node.js build dependencies.

The staging deployment is configured with the `staging` GitHub Environment.
Production uses the same workflow and a separate `production` Environment.

Setup and runbook: **[docs/deploy/github-actions.md](../../docs/deploy/github-actions.md)**
