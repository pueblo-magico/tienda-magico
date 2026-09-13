import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

function findBash() {
  if (process.platform !== "win32") return "bash";

  return [
    "C:\\Program Files\\Git\\bin\\bash.exe",
    "C:\\Program Files\\Git\\usr\\bin\\bash.exe",
  ].find(existsSync);
}

test("managed staging runtime configuration is merged safely", (context) => {
  const bash = findBash();
  if (!bash) {
    context.skip("Bash is required to test the Linux deployment helper.");
    return;
  }

  const result = spawnSync(
    bash,
    [
      "-c",
      "export PATH=/usr/bin:/bin; bash deploy/manual/test-update-runtime-env.sh",
    ],
    { cwd: process.cwd(), encoding: "utf8" },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Runtime environment update tests passed\./);
});

test("the storefront image selects Payload during the Next.js build", async () => {
  const [dockerfile, artifactBuilder] = await Promise.all([
    readFile("deploy/docker/storefront.Dockerfile", "utf8"),
    readFile("deploy/manual/build-artifact.mjs", "utf8"),
  ]);

  assert.match(dockerfile, /ARG COMMERCE_PROVIDER/);
  assert.match(dockerfile, /COMMERCE_PROVIDER=\$COMMERCE_PROVIDER/);
  assert.match(
    artifactBuilder,
    /["']--build-arg["']\s*,\s*["']COMMERCE_PROVIDER=payload["']/,
  );
});
