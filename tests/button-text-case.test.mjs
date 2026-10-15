import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Tienda deja la transformación del texto al botón compartido", async () => {
  const sources = await Promise.all([
    readFile("src/features/cart/components/CartSummary.tsx", "utf8"),
    readFile("src/features/checkout/StaffCashDesk.tsx", "utf8"),
    readFile("src/app/ui-system/button/page.tsx", "utf8"),
  ]);
  assert.doesNotMatch(sources.join("\n"), /textCase=/);
});
