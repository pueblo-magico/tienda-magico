import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("las secciones migradas usan el contrato de Accordion 0.2.0", async () => {
  const [product, cart] = await Promise.all([
    readFile("src/features/product/ProductPage.tsx", "utf8"),
    readFile("src/features/cart/components/CartSummary.tsx", "utf8"),
  ]);

  assert.match(product, /from "@\/components\/ui\/ClientAccordion"/);
  assert.match(product, /header: labels\.description/);
  assert.match(cart, /defaultExpandedItems=/);
  assert.match(`${product}\n${cart}`, /header:/);
  assert.doesNotMatch(`${product}\n${cart}`, /defaultOpenItems=/);
});
