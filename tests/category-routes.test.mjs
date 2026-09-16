import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildCategoryPath,
  resolveLegacyCategoryRoute,
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
    {
      q: "cacao",
      sort: "price-asc",
      collection: "obsoleto",
      categories: "infusiones",
      minPrice: "10",
      maxPrice: "90",
      tags: "organico,local",
      origins: "AR,BO",
      availability: "available",
      after: "cursor",
    },
    ["bienestar-y-rituales", "cacao"],
  );

  assert.equal(
    buildShopHref("es", query),
    "/es/tienda/categorias/bienestar-y-rituales/cacao?q=cacao&categories=infusiones&sort=price-asc&minPrice=10&maxPrice=90&tags=organico%2Clocal&origins=AR%2CBO&availability=available&after=cursor",
  );
  assert.equal(
    buildShopHref("es", query, { dropAfter: true }),
    "/es/tienda/categorias/bienestar-y-rituales/cacao?q=cacao&categories=infusiones&sort=price-asc&minPrice=10&maxPrice=90&tags=organico%2Clocal&origins=AR%2CBO&availability=available",
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

test("las URLs antiguas se convierten solamente cuando la jerarquía es válida", () => {
  assert.deepEqual(
    resolveLegacyCategoryRoute(
      [root, child, grandchild],
      "bienestar-y-rituales",
      ["cacao"],
    ),
    { categoryPath: ["bienestar-y-rituales", "cacao"], categories: [] },
  );
  assert.deepEqual(
    resolveLegacyCategoryRoute(
      [root, child, grandchild],
      "bienestar-y-rituales",
      ["cacao", "ceremonial"],
    ),
    {
      categoryPath: ["bienestar-y-rituales"],
      categories: ["cacao", "ceremonial"],
    },
  );
  assert.equal(
    resolveLegacyCategoryRoute([root, child], "otra-coleccion", ["cacao"]),
    null,
  );
});

test("una subcategoría ajena no reemplaza el alcance de la colección anterior", () => {
  const anotherRoot = { ...root, id: "other", handle: "otra-coleccion" };
  const anotherChild = {
    ...child,
    id: "other-child",
    handle: "incienso",
    parent: anotherRoot,
  };

  assert.deepEqual(
    resolveLegacyCategoryRoute(
      [root, child, anotherRoot, anotherChild],
      root.handle,
      [anotherChild.handle],
    ),
    { categoryPath: [root.handle], categories: [anotherChild.handle] },
  );
});
