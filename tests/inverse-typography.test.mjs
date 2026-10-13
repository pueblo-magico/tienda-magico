import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { test } from "node:test";

test("la tipografía inversa no combina colores de texto incompatibles", async () => {
  const page = await readFile("src/features/impact/ImpactPage.tsx", "utf8");

  await assert.rejects(access("src/components/typography/SectionTitle.tsx"));
  await assert.rejects(access("src/components/typography/Body.tsx"));
  assert.match(page, /from "@pueblo-magico\/react-ui"/);
  assert.match(page, /<SectionTitle tone="inverse"/);
  assert.match(page, /<Body tone="inverse"/);
  assert.doesNotMatch(page, /text-brand-foreground\/75/);
});
