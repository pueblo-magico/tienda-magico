import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("la referencia de Tabs usa el contrato compartido 0.2.0", async () => {
  const page = await readFile("src/app/ui-system/tabs/page.tsx", "utf8");
  assert.match(page, /^"use client";/);
  assert.match(page, /import \{ Tabs \} from "@pueblo-magico\/react-ui"/);
  assert.match(page, /isDisabled: true/);
  assert.doesNotMatch(page, /disabled: true|onValueChange/);
});
