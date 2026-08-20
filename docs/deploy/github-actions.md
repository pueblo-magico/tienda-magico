# Deploy staging and production with GitHub Actions

This is the supported deployment path. GitHub Actions builds the storefront and
Payload CMS as immutable container images, publishes them to Artifact Registry,
and activates them on Compute Engine through IAP. The VM never receives a Git
checkout, `node_modules`, or application build tools.

```text
GitHub Environment → GitHub Actions → Artifact Registry → Google Cloud VM
       secrets             build images                  pull and run images
```

## Deployment model

| Environment | Trigger | VM | Intended use |
| --- | --- | --- | --- |
| `staging` | Push to `staging` | Staging VM | Automatic validation of changes |
| `production` | Manual workflow run from `main` | Production VM | Protected customer-facing release |

Both environments use the same variable and secret names, but their values are
independent. Do not reuse staging payment, database, Payload, or domain values
in production.

## 1. Prepare Google Cloud

Run the following from an administrator workstation after setting the values
for your project. The example uses `us-central1`; for an Always Free-eligible
VM choose `us-central1`, `us-west1`, or `us-east1`. Use at least an `e2-small`
with a 30 GB standard persistent boot disk for this complete application stack;
monitor staging memory and move to a larger machine when its workload requires
it. An `e2-micro` is not recommended for the two Next.js services, PostgreSQL,
Docker, and nginx running together.

```bash
export PROJECT_ID="your-project-id"
export REGION="us-central1"
export ZONE="us-central1-a"
export REPOSITORY="tienda"
export GITHUB_OWNER="your-github-owner"
export GITHUB_REPOSITORY="tienda-magico"
export PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"

gcloud config set project "$PROJECT_ID"
gcloud services enable artifactregistry.googleapis.com compute.googleapis.com \
  iamcredentials.googleapis.com iam.googleapis.com sts.googleapis.com

gcloud artifacts repositories create "$REPOSITORY" \
  --location="$REGION" --repository-format=docker \
  --description="Tienda Magico deployment images"
```

Apply the included image retention policy so a limited rollback window is kept:

```bash
gcloud artifacts repositories set-cleanup-policies "$REPOSITORY" \
  --project="$PROJECT_ID" \
  --location="$REGION" \
  --policy=deploy/gce/artifact-registry-cleanup.json
```

The policy file is a JSON **list**: it removes untagged versions after one day,
removes tagged versions after fourteen days, and protects the four newest
versions of each image package for rollback. Artifact Registry evaluates cleanup
policies asynchronously, so deletions can take about a day to occur.

### Create the two runtime identities and VMs

Create a runtime service account for each VM. It can only read deployment
images. Repeat the VM command once for `tienda-staging` and later for
`tienda-production`, changing the names as appropriate.

```bash
export RUNTIME_SA="tienda-staging-runtime"
export VM_NAME="tienda-staging"

gcloud iam service-accounts create "$RUNTIME_SA" \
  --display-name="Tienda staging VM runtime"

gcloud artifacts repositories add-iam-policy-binding "$REPOSITORY" \
  --location="$REGION" \
  --member="serviceAccount:${RUNTIME_SA}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.reader"

gcloud compute instances create "$VM_NAME" \
  --zone="$ZONE" \
  --machine-type=e2-small \
  --image-family=ubuntu-2404-lts-amd64 \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=30GB \
  --boot-disk-type=pd-standard \
  --service-account="${RUNTIME_SA}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --scopes=https://www.googleapis.com/auth/cloud-platform \
  --tags=tienda-http,tienda-https
```

Create VPC rules once per project. IAP needs SSH access from its documented
proxy range; HTTP and HTTPS are the only public application ports.

```bash
gcloud compute firewall-rules create tienda-allow-iap-ssh \
  --direction=INGRESS --action=ALLOW --rules=tcp:22 \
  --source-ranges=35.235.240.0/20

gcloud compute firewall-rules create tienda-allow-http-https \
  --direction=INGRESS --action=ALLOW --rules=tcp:80,tcp:443 \
  --target-tags=tienda-http,tienda-https
```

Assign an external IP or equivalent public ingress, then create DNS A records
for the environment's storefront and CMS hosts. For example:

```text
staging-shop.example.com  → staging VM external IP
staging-cms.example.com   → staging VM external IP
```

### Create the GitHub deployment identity

GitHub authenticates with short-lived OIDC credentials—never a downloaded
service-account key. The condition below limits the identity to this repository
and its deployment branches.

```bash
export DEPLOY_SA="tienda-github-deployer"
export POOL_ID="github"
export PROVIDER_ID="github-actions"

gcloud iam service-accounts create "$DEPLOY_SA" \
  --display-name="Tienda GitHub deployment"

gcloud iam workload-identity-pools create "$POOL_ID" \
  --location=global --display-name="GitHub Actions"

gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_ID" \
  --location=global --workload-identity-pool="$POOL_ID" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
  --attribute-condition="assertion.repository=='${GITHUB_OWNER}/${GITHUB_REPOSITORY}' && (assertion.ref=='refs/heads/staging' || assertion.ref=='refs/heads/main')"

gcloud iam service-accounts add-iam-policy-binding \
  "${DEPLOY_SA}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/attribute.repository/${GITHUB_OWNER}/${GITHUB_REPOSITORY}"

gcloud artifacts repositories add-iam-policy-binding "$REPOSITORY" \
  --location="$REGION" \
  --member="serviceAccount:${DEPLOY_SA}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role=roles/artifactregistry.writer

for ROLE in roles/compute.osAdminLogin roles/compute.viewer roles/iap.tunnelResourceAccessor; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${DEPLOY_SA}@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="$ROLE"
done
```

If your organization disallows project-wide bindings, grant equivalent roles at
the narrowest supported resource scope. The deployer must be an OS Login admin
because the workflow uses `sudo` for the one-time VM bootstrap and release
activation.

## 2. Configure GitHub Environments

In **Repository settings → Environments**, create `staging` and `production`.
Add required reviewers to `production`; leave staging unprotected for automatic
deployment. Configure the following values separately in each environment.

### Variables

Use [`deploy/config/deployment.env.example`](../../deploy/config/deployment.env.example)
as the checklist. Set every listed key plus these two identity values:

| Variable | Example / purpose |
| --- | --- |
| `GCP_WIF_PROVIDER` | `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github/providers/github-actions` |
| `GCP_SERVICE_ACCOUNT` | `tienda-github-deployer@PROJECT_ID.iam.gserviceaccount.com` |

All values used as Docker build arguments are non-secret. The public URLs in
`NEXT_PUBLIC_*`, plus CMS URL settings, are compiled into images; they must
match the environment's domains. A staging image and a production image are
therefore built separately from the same commit when their public domains differ.

### Secrets

Create these three GitHub Environment secrets. Each secret is the complete
dotenv content of the file shown below; preserve line breaks.

| Secret | Destination on VM |
| --- | --- |
| `STOREFRONT_ENV` | `/etc/tienda-magico/storefront.env` |
| `CMS_ENV` | `/etc/tienda-magico/cms.env` |
| `POSTGRES_ENV` | `/etc/tienda-magico/postgres.env` |

Start with the templates in [`deploy/gce/env/`](../../deploy/gce/env/). Generate
one password and use it in both `POSTGRES_ENV` and CMS `DATABASE_URL`:

```bash
POSTGRES_PASSWORD="$(openssl rand -base64 36 | tr -d '/+=')"
PAYLOAD_SECRET="$(openssl rand -base64 48)"
```

Inside `CMS_ENV`, connect through the Compose service name—not VM loopback:

```dotenv
HOSTNAME=0.0.0.0
DATABASE_URL=postgresql://postgres:PASSWORD@postgres:5432/tienda_magico_cms
```

Use `HOSTNAME=0.0.0.0` in `STOREFRONT_ENV` as well. Docker still publishes both
application ports on VM loopback only, so they remain accessible externally
only through nginx.

For staging, use sandbox/test payment credentials. For production, use live
credentials and a different database password and Payload secret. Do not put
secrets in GitHub Variables, committed files, Docker build arguments, or image
layers.

## 3. First staging deployment

1. Commit and push this deployment configuration to the `staging` branch.
2. Confirm all `staging` variables and secrets are present.
3. Push a change to `staging`, or run **Actions → Build and deploy → Run
   workflow** and select `staging`.
4. The workflow builds the images, publishes their commit-SHA tags, uploads the
   small operational bundle, bootstraps the VM, writes runtime configuration,
   and waits for storefront and CMS health checks.
5. Inspect the action log and open `http://STOREFRONT_HOST` and
   `http://CMS_HOST/admin`.

The initial release uses HTTP. Once DNS resolves to the VM, issue certificates
on the staging VM:

```bash
sudo apt-get update && sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d staging-shop.example.com -d staging-cms.example.com
```

Replace the example domains with the `STOREFRONT_HOST` and `CMS_HOST` values.
After TLS works, ensure every public URL in the GitHub Environment variables and
runtime secrets uses `https://`, then deploy staging again to rebuild the image
with those URLs.

## 4. Production deployment

Complete the same VM, DNS, TLS, GitHub Variables, and secrets setup for the
`production` Environment. Then:

1. Merge the validated change into `main`.
2. In **Actions → Build and deploy**, select **Run workflow**.
3. Select `production`; run it from `main`.
4. Approve the deployment if required reviewers are configured.
5. Verify storefront, CMS admin, checkout configuration, and CMS-to-storefront
   CORS after the workflow reports success.

Production is never triggered by a push. It builds new production-configured
images from the selected `main` commit, then deploys their immutable SHA tag.

## Rollback and routine verification

Each release is tagged with its commit SHA. To roll back an environment, run
**Build and deploy**, select that environment, and enter a retained previous
SHA in `image_tag`. This skips the build and re-activates the existing images.

The workflow health checks `http://127.0.0.1:3000/` and
`http://127.0.0.1:4000/admin` on the VM. For deeper checks, connect with IAP and
run:

```bash
sudo docker compose --env-file /etc/tienda-magico/deploy.env \
  -f /opt/tienda-magico/docker-compose.yml ps
sudo docker compose --env-file /etc/tienda-magico/deploy.env \
  -f /opt/tienda-magico/docker-compose.yml logs --tail=100
```

Persistent state is deliberately outside image containers:

- PostgreSQL: `/var/lib/tienda-magico/postgres`
- Payload media: `/var/lib/tienda-magico/media`
- Runtime environment files: `/etc/tienda-magico/*.env`

Back up the database and media before production releases and test restoration.
Monitor billing, VM disk use, and Artifact Registry storage; free-tier quotas
are limits, not a capacity guarantee.
