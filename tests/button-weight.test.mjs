import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Tienda no mantiene una API paralela de peso para Button", async () => {
  const [page, adapter] = await Promise.all([
    readFile("src/app/ui-system/button/page.tsx", "utf8"),
    readFile("src/components/ui/ButtonLink.tsx", "utf8"),
  ]);
  assert.doesNotMatch(`${page}\n${adapter}`, /weight=/);
  assert.match(page, /isDisabled/);
  assert.match(page, /isLoading/);
});
