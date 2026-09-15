import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  buildShopHref,
  parseShopQuery,
  toCommerceProductsParams,
} from "@/features/shop/search-params";

test("los filtros nuevos se conservan en la URL", () => {
  const query = parseShopQuery({
    collection: "bienestar",
    categories: "cacao,te,cacao,valor inválido",
    origins: "AR,BO",
    availability: "available",
  });

  assert.equal(query.collection, "bienestar");
  assert.deepEqual(query.categories, ["cacao", "te"]);
  assert.deepEqual(query.origins, ["AR", "BO"]);
  assert.equal(query.availableOnly, true);
  assert.match(
    buildShopHref("es", query),
    /collection=bienestar&categories=cacao%2Cte[\s\S]*origins=AR%2CBO&availability=available/,
  );
});

test("las categorías elegidas reemplazan el alcance de la página al consultar productos", () => {
  const filtered = parseShopQuery({
    collection: "bienestar",
    categories: "cacao,te",
  });
  const scoped = parseShopQuery({ collection: "bienestar" });

  assert.deepEqual(toCommerceProductsParams(filtered, "es").collections, [
    "cacao",
    "te",
  ]);
  assert.deepEqual(toCommerceProductsParams(scoped, "es").collections, [
    "bienestar",
  ]);
});

test("el panel aplica filtros al cambiar y no muestra botón aplicar", async () => {
  const source = await readFile("src/features/shop/ShopFilters.tsx", "utf8");

  assert.match(source, /onChange=\{handleChange\}/);
  assert.match(source, /router\.replace/);
  assert.doesNotMatch(source, /labels\.apply|type="submit"/);
  assert.match(source, /<details[\s\S]+<summary/);
  assert.match(source, /name="origins"/);
  assert.match(source, /name="categories"/);
  assert.match(source, /data\.getAll\("categories"\)/);
  assert.doesNotMatch(source, /target\.name === "collection"/);
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
