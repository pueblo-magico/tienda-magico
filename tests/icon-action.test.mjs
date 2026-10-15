import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("IconAction compone Button y ButtonLink sin duplicar su estilo base", async () => {
  const source = await readFile("src/components/ui/IconAction.tsx", "utf8");
  assert.match(source, /Button, type ButtonProps/);
  assert.match(source, /<ButtonLink/);
  assert.match(source, /loading \? \(/);
  assert.match(source, /animate-spin/);
  assert.doesNotMatch(source, /button-color-|variant="icon-label"/);
});
