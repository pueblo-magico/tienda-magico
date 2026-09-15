import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("la tipografía inversa no combina colores de texto incompatibles", async () => {
  const [title, body, page] = await Promise.all([
    readFile("src/components/typography/SectionTitle.tsx", "utf8"),
    readFile("src/components/typography/Body.tsx", "utf8"),
    readFile("src/features/impact/ImpactPage.tsx", "utf8"),
  ]);

  assert.match(title, /tone\?: "default" \| "inverse"/);
  assert.match(title, /tone === "inverse"/);
  assert.match(body, /tone\?: "default" \| "inverse"/);
  assert.match(body, /tone === "inverse"/);
  assert.match(page, /<SectionTitle tone="inverse"/);
  assert.match(page, /<Body tone="inverse"/);
  assert.doesNotMatch(page, /text-brand-foreground\/75/);
});
