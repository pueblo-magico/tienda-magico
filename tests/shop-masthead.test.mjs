import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("the shop masthead is full width with overlapping category cards", async () => {
  const source = await readFile("src/features/shop/ShopPage.tsx", "utf8");

  assert.match(source, /const heroImage =/);
  assert.match(source, /className="relative h-72 w-full overflow-hidden"/);
  assert.match(source, /className="relative z-10 -mt-8"/);
  assert.match(source, /className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"/);
});
