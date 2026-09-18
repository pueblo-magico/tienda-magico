# Automated staging deployment

The [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) workflow
automatically deploys every commit that reaches the `staging` branch. In the
normal workflow, this happens when a pull request is merged into that branch.

## Initial preparation

1. Prepare the VM by following [`deploy/manual/README.md`](../../deploy/manual/README.md).
2. Create the `staging` Environment under **GitHub -> Settings -> Environments**.
3. Configure these Environment variables:

| Variable                  | Purpose                                                      |
| ------------------------- | ------------------------------------------------------------ |
| `SHOP_URL`                | Public HTTPS storefront origin without a trailing `/`        |
| `CMS_URL`                 | Public HTTPS CMS origin without a trailing `/`               |
| `DEPLOY_PLATFORM`         | `linux/amd64` or `linux/arm64`, according to the VM          |
| `SSH_HOST`                | Public VM domain or IP address                               |
| `SSH_PORT`                | SSH port; normally `22`                                      |
| `SSH_USER`                | Non-root user authorized to deploy                           |
| `CHECKOUT_PROVIDER`       | Checkout adapter; set `mercado-pago` for staging             |
| `MERCADOPAGO_SANDBOX`     | `true` for test credentials and staging payments             |
| `MERCADOPAGO_WEBHOOK_URL` | `SHOP_URL` followed by `/api/checkout/webhooks/mercado-pago` |

4. Configure these Environment secrets:

| Secret                     | Purpose                                  |
| -------------------------- | ---------------------------------------- |
| `SSH_PRIVATE_KEY`          | Dedicated Ed25519 private deployment key |
| `SSH_KNOWN_HOSTS`          | Previously verified VM host key          |
| `MERCADOPAGO_ACCESS_TOKEN` | Server-side Mercado Pago test credential |
| `MERCADOPAGO_WEBHOOK_SECRET` | Webhook signing secret for the same application |

5. Confirm that the SSH user can run `sudo -n true` and that the environment
   files under `/opt/tienda-magico/env` contain no placeholders.

The workflow manages the commerce connection and checkout keys in
`storefront.env` on every deployment. `COMMERCE_PROVIDER` is set to `payload`;
the Payload URLs and public site URL are derived from `CMS_URL` and `SHOP_URL`.
Payload pricing is fixed to ARS amounts expressed in cents. The workflow
preserves every other key already present in the file. Database, Payload, CMS
API, and revalidation secrets remain VM-managed.

| Setting                                              | Owner                | Phase                              |
| ---------------------------------------------------- | -------------------- | ---------------------------------- |
| `SHOP_URL`, `CMS_URL`                                | GitHub variable      | Image build and runtime deployment |
| `COMMERCE_PROVIDER`, Payload URLs, public site URL   | Derived by workflow  | Runtime deployment                 |
| `CHECKOUT_PROVIDER`                                  | GitHub variable      | Runtime deployment                 |
| `MERCADOPAGO_SANDBOX`                                | GitHub variable      | Runtime deployment                 |
| `MERCADOPAGO_WEBHOOK_URL`                            | GitHub variable      | Runtime deployment                 |
| `MERCADOPAGO_ACCESS_TOKEN`                           | GitHub secret        | Runtime deployment                 |
| `MERCADOPAGO_WEBHOOK_SECRET`                         | GitHub secret        | Runtime deployment                 |
| Database, Payload, CMS API, and revalidation secrets | VM environment files | Runtime                            |

Runtime secrets are never passed as Docker build arguments or written to the
workflow summary. During activation, the workflow backs up the existing
storefront and deployment environment files. If activation fails, it restores
both files and restarts the previous release.

## Recommended branch configuration

Protect `staging` under **GitHub -> Settings -> Branches**:

- require pull requests before merging;
- require the repository checks to pass;
- block force pushes and branch deletion;
- add an approval requirement to the `staging` Environment if you want a human
  confirmation before each deployment.

Branch protection controls which code may reach `staging`. The Environment
controls who may authorize access to the infrastructure.

## Deploy a change

1. Update your branch from `staging` and resolve conflicts.
2. Open a pull request with `staging` as its base branch.
3. Confirm that all required checks pass.
4. Merge the pull request.
5. Open **Actions -> Deploy staging** and follow the workflow run.

The workflow builds immutable images tagged as `staging-SHORT_SHA`, verifies
the checksum, copies them over SSH, activates the release, waits for the internal
health checks, and verifies the public HTTPS endpoints.

## Post-deployment verification

When the workflow finishes, review its summary and verify:

- the storefront at `SHOP_URL`;
- the CMS admin at `CMS_URL/admin`;
- CMS login and primary navigation;
- catalog, cart, and fulfillment-method selection;
- a test checkout when the change affects payments;
- that the deployed version corresponds to the merged commit SHA.

To inspect the VM:

```bash
sudo docker compose \
  --env-file /opt/tienda-magico/deployment.env \
  -f /opt/tienda-magico/compose.yml ps
sudo docker compose \
  --env-file /opt/tienda-magico/deployment.env \
  -f /opt/tienda-magico/compose.yml logs --tail=200
```

## Rollback

1. Find a previously successful tag under **Actions -> Deploy staging**.
2. Choose **Run workflow** on the `staging` branch.
3. Enter that tag in `existing_tag`.
4. Run the workflow and repeat the post-deployment verification.

Rollback changes the application images, but it does not reverse database
migrations or uploaded files. Before a risky migration, create backups of
PostgreSQL and the media directory and copy them off the VM.

## Quick troubleshooting

- **Configuration failure:** review the Environment variables and secrets.
- **SSH failure:** verify the host, port, user, key, and `SSH_KNOWN_HOSTS`.
- **Activation failure:** inspect the CMS, storefront, and PostgreSQL logs.
- **Internal health checks pass but the public smoke check fails:** inspect DNS,
  Caddy, TLS certificates, the firewall, and whether `SHOP_URL` and `CMS_URL`
  match the VM configuration.
- **Migration failure:** do not force activation; restore the backup or correct
  the migration before retrying.

For the complete technical reference, see
[`docs/deploy/github-actions.md`](github-actions.md).

Spanish version: [`docs/deploy/staging-es.md`](staging-es.md).
