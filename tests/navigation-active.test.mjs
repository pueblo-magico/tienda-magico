import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  isNavigationItemActive,
  mainNavigation,
} from "../src/config/navigation.ts";

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
