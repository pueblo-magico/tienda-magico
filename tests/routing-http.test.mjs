import assert from "node:assert/strict";
import { test } from "node:test";

const origin = process.env.ROUTING_TEST_URL;

test(
  "las rutas comerciales localizadas no generan bucles de redirección",
  { skip: !origin },
  async () => {
    const base = new URL(origin);
    assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(base.hostname));
    for (const [source, destination] of [
      ["/es/shop?q=cacao", "/es/tienda?q=cacao"],
      ["/es/tienda", "/es/tienda"],
      ["/es/cart", "/es/carrito"],
      ["/es/carrito", "/es/carrito"],
      ["/en/shop", "/en/shop"],
      ["/en/cart", "/en/cart"],
    ]) {
      const response = await fetch(new URL(source, base), {
        signal: AbortSignal.timeout(30000),
      });
      assert.equal(response.status, 200, source);
      const finalURL = new URL(response.url);
      assert.equal(finalURL.pathname + finalURL.search, destination);
      await response.body.cancel();
    }
  },
);
