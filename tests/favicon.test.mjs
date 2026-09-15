import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { test } from "node:test";

test("uses the shop logo as the storefront favicon", async () => {
  const layout = await readFile("src/app/layout.tsx", "utf8");

  assert.match(layout, /icons:\s*"\/favicon\.svg"/);
  await assert.rejects(access("src/app/favicon.ico"));
});
