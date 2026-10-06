import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("el sistema UI compone las tarjetas publicadas por react-ui", async () => {
  const source = await readFile("src/app/ui-system/example/page.tsx", "utf8");
  assert.match(source, /InfoCard, StatCard/);
  assert.doesNotMatch(source, /ImpactCard/);
  assert.match(source, /from "@pueblo-magico\/react-ui"/);
});

test("InfoCard conserva una referencia de variantes y tonos compartidos", async () => {
  const page = await readFile("src/app/ui-system/info-card/page.tsx", "utf8");
  assert.match(page, /<InfoCard/);
  assert.match(page, /tone="inverse"/);
  assert.match(page, /variant="centered"/);
  assert.match(page, /variant="prominent"/);
  assert.match(page, /variant="testimonial"/);
  assert.match(page, /tone="accent"/);
  assert.match(page, /from "@pueblo-magico\/react-ui"/);
});
