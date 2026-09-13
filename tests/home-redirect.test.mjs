import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("the localized home page temporarily redirects to the shop", async () => {
  const source = await readFile("src/app/[locale]/page.tsx", "utf8");

  assert.match(source, /redirect\(localizePath\(locale, "\/shop"\)\)/);
  assert.doesNotMatch(source, /<FallbackHome|<RenderBlocks/);
});
