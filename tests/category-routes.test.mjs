import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  buildCategoryPath,
  resolveCategoryPath,
} from "@/features/shop/category-hierarchy";
import { buildShopHref, parseShopQuery } from "@/features/shop/search-params";
import { internalPath, localizePath } from "@/config/navigation";

const root = {
  id: "root",
  handle: "bienestar-y-rituales",
  title: "Bienestar y rituales",
  description: "",
  image: null,
  icon: null,
  parent: null,
  displayOrder: 0,
};
const child = {
  ...root,
  id: "child",
  handle: "cacao",
  title: "Cacao",
  parent: root,
};
const grandchild = {
  ...root,
  id: "grandchild",
  handle: "ceremonial",
  title: "Ceremonial",
  parent: child,
};

test("las rutas de categorías se localizan sin modificar las URLs de producto", () => {
  assert.equal(
    localizePath("es", "/shop/categories/bienestar-y-rituales/cacao"),
    "/es/tienda/categorias/bienestar-y-rituales/cacao",
  );
  assert.equal(
    localizePath("en", "/shop/categories/bienestar-y-rituales/cacao"),
    "/en/shop/categories/bienestar-y-rituales/cacao",
  );
  assert.equal(
    localizePath("es", "/shop/cacao-ceremonial"),
    "/es/tienda/cacao-ceremonial",
  );
  assert.equal(
    internalPath("/es/tienda/categorias/bienestar-y-rituales/cacao"),
    "/shop/categories/bienestar-y-rituales/cacao",
  );
});

test("la URL canónica conserva filtros secundarios y omite collection", () => {
  const query = parseShopQuery(
    { q: "cacao", sort: "price-asc", collection: "obsoleto" },
    ["bienestar-y-rituales", "cacao"],
  );

  assert.equal(
    buildShopHref("es", query),
    "/es/tienda/categorias/bienestar-y-rituales/cacao?q=cacao&sort=price-asc",
  );
});

test("la jerarquía se construye y valida por relaciones padre-hijo", () => {
  assert.deepEqual(buildCategoryPath(grandchild), [
    "bienestar-y-rituales",
    "cacao",
    "ceremonial",
  ]);
  assert.deepEqual(
    resolveCategoryPath(
      [root, child, grandchild],
      ["bienestar-y-rituales", "cacao", "ceremonial"],
    ),
    [root, child, grandchild],
  );
  assert.equal(
    resolveCategoryPath([root, child], ["otra-coleccion", "cacao"]),
    null,
  );
});

test("la tienda redirige URLs antiguas de categoría de forma permanente", async () => {
  const [shopRoute, productRoute] = await Promise.all([
    readFile("src/app/[locale]/shop/page.tsx", "utf8"),
    readFile("src/app/[locale]/shop/[handle]/page.tsx", "utf8"),
  ]);

  assert.match(shopRoute, /query\.collection[\s\S]+permanentRedirect/);
  assert.match(productRoute, /loadProductPage\(handle, locale\)/);
});
