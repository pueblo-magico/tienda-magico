import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  internalPath,
  isNavigationItemActive,
  localizePath,
  mainNavigation,
} from "../src/config/navigation.ts";

test("localiza las rutas de pago y caja conservando parámetros", () => {
  for (const [internal, spanish] of [
    ["/checkout", "/pago"],
    ["/checkout/pending", "/pago/pendiente"],
    ["/checkout/review", "/pago/revision"],
    ["/checkout/success", "/pago/exito"],
    ["/checkout/failure", "/pago/error"],
    ["/staff/cash", "/personal/caja"],
  ]) {
    assert.equal(
      localizePath("es", `${internal}?reference=abc&from=orders#details`),
      `/es${spanish}?reference=abc&from=orders#details`,
    );
    assert.equal(localizePath("en", internal), `/en${internal}`);
    assert.equal(internalPath(`/es${spanish}`), internal);
  }
  assert.equal(localizePath("es", "/shop/pending"), "/es/tienda/pending");
});

test("la ruta de impacto se localiza en español e inglés", () => {
  assert.equal(localizePath("es", "/impact"), "/es/impacto");
  assert.equal(localizePath("en", "/impact"), "/en/impact");
  assert.equal(internalPath("/es/impacto"), "/impact");
  assert.equal(internalPath("/en/impact"), "/impact");
});

test("active navigation matching follows localized nested shop routes", () => {
  const shop = mainNavigation.find((item) => item.href === "/shop");
  const external = mainNavigation.find((item) => item.kind === "external");

  assert.ok(shop);
  assert.ok(external);
  assert.equal(isNavigationItemActive(shop, "es", "/es/tienda"), true);
  assert.equal(isNavigationItemActive(shop, "es", "/es/tienda/cacao"), true);
  assert.equal(isNavigationItemActive(shop, "en", "/en/shop/cacao"), true);
  assert.equal(isNavigationItemActive(shop, "es", "/es/carrito"), false);
  assert.equal(isNavigationItemActive(external, "es", "/es/tienda"), false);
});

test("la navegación principal incluye la página de impacto localizada", () => {
  const impact = mainNavigation.find((item) => item.href === "/impact");

  assert.ok(impact);
  assert.equal(impact.kind, "internal");
  assert.equal(impact.label.es, "Impacto");
  assert.equal(impact.label.en, "Impact");
  assert.equal(isNavigationItemActive(impact, "es", "/es/impacto"), true);
  assert.equal(isNavigationItemActive(impact, "en", "/en/impact"), true);
});

test("desktop and mobile navigation expose the active page", async () => {
  const [header, mobileMenu] = await Promise.all([
    readFile("src/components/layout/Header.tsx", "utf8"),
    readFile("src/components/layout/MobileMenu.tsx", "utf8"),
  ]);

  assert.match(header, /usePathname\(\)/);
  assert.match(header, /aria-current=\{item\.isActive \? "page" : undefined\}/);
  assert.match(
    mobileMenu,
    /aria-current=\{item\.isActive \? "page" : undefined\}/,
  );
});
