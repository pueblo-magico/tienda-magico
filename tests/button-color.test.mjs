import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("los botones usan variantes semánticas de react-ui", async () => {
  const page = await readFile("src/app/ui-system/button/page.tsx", "utf8");

  assert.match(page, /from "@pueblo-magico\/react-ui"/);
  for (const variant of ["secondary", "ghost", "accent", "danger"]) {
    assert.match(page, new RegExp(`variant="${variant}"`));
  }
  assert.doesNotMatch(page, /color=|terracotta|forest|earth/);
});

test("la navegación aplica las variantes publicadas sin simular un botón", async () => {
  const adapter = await readFile("src/components/ui/ButtonLink.tsx", "utf8");
  assert.match(adapter, /buttonVariants/);
  assert.match(adapter, /<Link/);
  assert.doesNotMatch(adapter, /role="button"/);
});
