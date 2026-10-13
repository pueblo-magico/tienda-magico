import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("la integración continua protege los PR y autentica GitHub Packages", async () => {
  const workflow = await readFile(".github/workflows/ci.yml", "utf8");

  assert.match(
    workflow,
    /pull_request:\s*\n\s+branches: \[develop, staging, production\]/,
  );
  assert.match(workflow, /permissions:\s*\n\s+contents: read/);
  assert.match(workflow, /packages: read/);
  assert.match(
    workflow,
    /NODE_AUTH_TOKEN: \$\{\{ secrets\.GH_PACKAGES_TOKEN \}\}/,
  );
  assert.match(workflow, /cancel-in-progress: true/);
  assert.equal(
    (workflow.match(/secrets\./g) ?? []).length,
    1,
    "El workflow solo debe acceder al secreto de lectura de paquetes",
  );
  assert.equal(
    (workflow.match(/node-version: 24\.18\.0/g) ?? []).length,
    4,
    "Todos los jobs deben usar la misma versión de Node que producción",
  );

  for (const job of ["quality", "tests", "database", "build"]) {
    assert.ok(workflow.includes(`\n  ${job}:\n`), `Falta el job ${job}`);
  }

  for (const command of [
    "npm run lint",
    "npm run lint:cms",
    "npm run typecheck",
    "npm run typecheck:cms",
    "npm run test:ci",
    "npm run test:task-05:db",
    "npm run build",
    "npm run build:cms",
  ]) {
    assert.ok(workflow.includes(command), `Falta ejecutar ${command}`);
  }

  assert.match(workflow, /image: postgres:16-alpine/);
  assert.match(workflow, /TIENDA_TEST_DATABASE_URL:/);
  assert.match(
    workflow,
    /grep -Fq "@vercel\/turbopack-next\/internal\/font\/google\/font"/,
  );
});
