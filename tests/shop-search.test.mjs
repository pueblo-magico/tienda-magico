import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("el encabezado abre la búsqueda antes del carrito", async () => {
  const source = await readFile("src/components/layout/Header.tsx", "utf8");

  assert.match(source, /<SearchButton[\s\S]+<CartButton/);
  assert.match(source, /<SearchDialog/);
});

test("la búsqueda dirige al catálogo y la página resume los resultados", async () => {
  const [dialog, form, page] = await Promise.all([
    readFile("src/features/search/SearchDialog.tsx", "utf8"),
    readFile("src/features/search/SearchForm.tsx", "utf8"),
    readFile("src/features/shop/ShopPage.tsx", "utf8"),
  ]);

  assert.match(dialog, /<SearchForm/);
  assert.match(form, /categoryPath\.length/);
  assert.match(form, /`\/shop\/categories\/\$\{categoryPath/);
  assert.match(form, /`\$\{pathname\}\?\$\{params\.toString\(\)\}`/);
  assert.match(form, /setQuery\(""\)/);
  assert.match(form, /value=\{query\}/);
  assert.match(
    page,
    /<SearchForm[\s\S]+initialQuery=\{query\.q\}[\s\S]+categoryPath=\{query\.categoryPath\}[\s\S]+\{query\.q \? \(/,
  );
  assert.match(page, /t\("resultsFor"/);
  assert.match(page, /query\.q/);
});
