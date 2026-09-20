import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("separa preparación, compilación, despliegue y etiqueta", async () => {
  const workflow = await readFile(".github/workflows/deploy.yml", "utf8");
  for (const job of ["prepare", "build", "deploy", "tag"])
    assert.ok(workflow.includes(`\n  ${job}:\n`));
  assert.match(workflow, /needs: \[prepare, build\]/);
  assert.match(workflow, /needs: \[prepare, deploy\]/);
  assert.match(workflow, /actions\/upload-artifact@v4/);
  assert.match(workflow, /actions\/download-artifact@v4/);
  assert.match(workflow, /compression-level: 0/);
  assert.equal((workflow.match(/contents: write/g) || []).length, 1);
});
