import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server.js";
import proxy from "../src/proxy.ts";
import { paymentPathnames } from "../src/config/navigation.ts";

test("redirige enlaces anteriores sin perder pedido ni parámetros repetidos", () => {
  for (const [route, paths] of Object.entries(paymentPathnames)) {
    const response = proxy(
      new NextRequest(`https://shop.test/es${route}?order=abc&tag=a&tag=b`),
    );
    assert.equal(response.status, 308);
    assert.equal(
      response.headers.get("location"),
      `https://shop.test/es${paths.es}?order=abc&tag=a&tag=b`,
    );
  }
});

test("reescribe las rutas localizadas hacia las páginas internas", () => {
  for (const [route, paths] of Object.entries(paymentPathnames)) {
    for (const locale of ["es", "en"]) {
      const response = proxy(
        new NextRequest(
          `https://shop.test/${locale}${paths[locale]}?order=abc`,
        ),
      );
      assert.equal(response.status, 200);
      if (locale === "en") {
        assert.equal(response.headers.get("x-middleware-next"), "1");
        continue;
      }
      const rewrite = new URL(response.headers.get("x-middleware-rewrite"));
      assert.equal(rewrite.pathname, `/${locale}${route}`);
      assert.equal(rewrite.searchParams.get("order"), "abc");
    }
  }
});
