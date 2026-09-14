import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("el orden se alinea a la derecha y se aplica al cambiar", async () => {
  const [source, page] = await Promise.all([
    readFile("src/features/shop/ShopToolbar.tsx", "utf8"),
    readFile("src/features/shop/ShopPage.tsx", "utf8"),
  ]);

  assert.match(source, /justify-end/);
  assert.match(source, /controlSize="compact"/);
  assert.match(source, /onChange=/);
  assert.doesNotMatch(source, /type="submit"|labels\.submit/);
  assert.match(page, /t\("results"[\s\S]+<ShopToolbar/);
});
