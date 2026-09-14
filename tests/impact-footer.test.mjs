import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("el catálogo muestra el resumen de impacto debajo de los productos", async () => {
  const [component, page] = await Promise.all([
    readFile("src/features/shop/ImpactFooter.tsx", "utf8"),
    readFile("src/features/shop/ShopPage.tsx", "utf8"),
  ]);

  assert.match(component, /Leaf/);
  assert.match(component, /Heart/);
  assert.match(component, /Mountain/);
  assert.match(component, /Truck/);
  assert.match(component, /Globe/);
  assert.match(page, /<ProductGrid[\s\S]+<ImpactFooter/);
});
