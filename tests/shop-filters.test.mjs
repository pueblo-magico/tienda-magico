import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { buildShopHref, parseShopQuery } from "@/features/shop/search-params";

test("los filtros nuevos se conservan en la URL", () => {
  const query = parseShopQuery({
    origins: "AR,BO",
    availability: "available",
  });

  assert.deepEqual(query.origins, ["AR", "BO"]);
  assert.equal(query.availableOnly, true);
  assert.match(
    buildShopHref("es", query),
    /origins=AR%2CBO&availability=available/,
  );
});

test("el panel aplica filtros al cambiar y no muestra botón aplicar", async () => {
  const source = await readFile("src/features/shop/ShopFilters.tsx", "utf8");

  assert.match(source, /onChange=\{handleChange\}/);
  assert.match(source, /router\.replace/);
  assert.doesNotMatch(source, /labels\.apply|type="submit"/);
  assert.match(source, /<details[\s\S]+<summary/);
  assert.match(source, /name="origins"/);
  assert.match(source, /name="availability"/);
  assert.match(source, /name="minPrice"[\s\S]+name="maxPrice"/);
  assert.match(
    source,
    /<Slider[\s\S]+value=\{\[priceRange\.min, priceRange\.max\]\}/,
  );
  assert.doesNotMatch(source, /type="range"/);
});

test("el rango de precios parte de cero aunque todos los productos cuesten igual", async () => {
  const source = await readFile(
    "src/features/shop/load-shop-catalog.ts",
    "utf8",
  );

  assert.match(source, /const priceBounds = \{\s*min: 0,/);
});
