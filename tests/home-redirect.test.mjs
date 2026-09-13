import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("the localized home page temporarily redirects to the shop", async () => {
  const [source, header] = await Promise.all([
    readFile("src/app/[locale]/page.tsx", "utf8"),
    readFile("src/components/layout/Header.tsx", "utf8"),
  ]);

  assert.match(source, /redirect\(localizePath\(locale, "\/shop"\)\)/);
  assert.doesNotMatch(source, /<FallbackHome|<RenderBlocks/);
  assert.match(header, /homeHref = localizePath\(locale, "\/shop"\)/);
  assert.match(header, /href=\{homeHref\}[\s\S]+prefetch=\{false\}/);
});
