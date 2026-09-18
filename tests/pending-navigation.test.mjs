import assert from "node:assert/strict";
import { test } from "node:test";
import { pendingReturnLink } from "../src/features/checkout/pending-navigation.ts";

test("vuelve al historial en ambos idiomas cuando el origen es pedidos", () => {
  assert.deepEqual(pendingReturnLink("orders", "es"), {
    href: "/es/mis-pedidos",
    labelKey: "backToOrders",
  });
  assert.deepEqual(pendingReturnLink("orders", "en"), {
    href: "/en/orders",
    labelKey: "backToOrders",
  });
});

test("checkout, enlaces antiguos y orígenes no permitidos vuelven al carrito", () => {
  for (const source of [
    "cart",
    undefined,
    "",
    "https://example.com",
    "/orders",
  ]) {
    assert.deepEqual(pendingReturnLink(source, "es"), {
      href: "/es/carrito",
      labelKey: "backToCart",
    });
  }
});
