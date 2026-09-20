import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

test("etiqueta producción solo después de verificar el despliegue", async () => {
  const workflow = await readFile(".github/workflows/deploy.yml", "utf8");
  assert.match(workflow, /git tag -a/);
  assert.match(workflow, /git push origin "refs\/tags\/\$IMAGE_TAG"/);
  assert.ok(
    workflow.indexOf("git tag -a") > workflow.indexOf('check_endpoint "CMS"'),
  );
  assert.match(
    workflow,
    /success\(\) && github.ref_name == 'production' && env.BUILD_RELEASE == 'true'/,
  );
});

test("despliega staging y production con entornos aislados", async () => {
  const workflow = await readFile(".github/workflows/deploy.yml", "utf8");
  assert.match(workflow, /branches: \[staging, production\]/);
  assert.match(workflow, /environment: \$\{\{ github.ref_name \}\}/);
  assert.match(workflow, /group: tienda-magico-\$\{\{ github.ref_name \}\}/);
  assert.match(
    workflow,
    /github.ref == 'refs\/heads\/staging' \|\| github.ref == 'refs\/heads\/production'/,
  );
  assert.match(
    workflow,
    /IMAGE_TAG="\$\{DEPLOY_ENVIRONMENT\}-\$\{GITHUB_SHA:0:12\}"/,
  );
  assert.match(workflow, /production\) expected_sandbox=false/);
});

test("valida modo de pago y HTTPS antes de desplegar producción", async (context) => {
  const bash =
    process.platform === "win32"
      ? "C:/Program Files/Git/bin/bash.exe"
      : "/bin/bash";
  if (!existsSync(bash)) return context.skip("Bash no está disponible.");
  const workflow = await readFile(".github/workflows/deploy.yml", "utf8");
  const script = workflow
    .split("        run: |\n")[1]
    .split("\n      - name:")[0]
    .split("\n")
    .map((line) => line.replace(/^          /, ""))
    .join("\n");
  for (const [environment, sandbox, origin, expected] of [
    ["production", "false", "https://shop.example.test", 0],
    ["production", "true", "https://shop.example.test", 1],
    ["production", "false", "http://shop.example.test", 1],
    ["staging", "true", "https://shop.example.test", 0],
    ["staging", "false", "https://shop.example.test", 1],
  ]) {
    const result = spawnSync(bash, ["-c", script], {
      encoding: "utf8",
      env: {
        ...process.env,
        DEPLOY_ENVIRONMENT: environment,
        MERCADOPAGO_SANDBOX: sandbox,
        SHOP_URL: origin,
        CMS_URL: "https://cms.example.test",
        DEPLOY_PLATFORM: "linux/amd64",
        SSH_HOST: "example.test",
        SSH_USER: "deploy",
        CHECKOUT_PROVIDER: "mercado-pago",
        MERCADOPAGO_WEBHOOK_URL: `${origin}/api/checkout/webhooks/mercado-pago`,
        MERCADOPAGO_ACCESS_TOKEN: "test-placeholder",
        MERCADOPAGO_WEBHOOK_SECRET: "test-placeholder",
        REQUESTED_TAG: "",
        GITHUB_SHA: "0123456789abcdef",
        GITHUB_RUN_ID: "12345",
        GITHUB_RUN_ATTEMPT: "2",
        GITHUB_ENV: "/dev/null",
        GITHUB_OUTPUT: "/dev/null",
      },
    });
    assert.equal(result.status, expected, result.stderr || result.stdout);
    if (expected === 0)
      assert.ok(result.stdout.includes(`${environment}-0123456789ab`));
  }
});
