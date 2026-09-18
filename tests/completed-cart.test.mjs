import assert from "node:assert/strict";
import test from "node:test";
import { getCart } from "../src/lib/commerce/providers/payload-ecommerce/cart.ts";

test("un carrito comprado se devuelve vacío sin recalcular su catálogo", async () => {
  const previousFetch = globalThis.fetch;
  const previousUrl = process.env.PAYLOAD_ECOMMERCE_URL;
  process.env.PAYLOAD_ECOMMERCE_URL = "https://cms.example";
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    return Response.json({
      id: 1,
      currency: "ARS",
      items: [],
      purchasedAt: "2026-09-17T12:00:00Z",
    });
  };
  try {
    assert.equal(await getCart("1::test"), null);
    assert.equal(requests, 1);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.PAYLOAD_ECOMMERCE_URL;
    else process.env.PAYLOAD_ECOMMERCE_URL = previousUrl;
  }
});

test("un carrito activo conserva su referencia y los errores transitorios no lo reemplazan", async () => {
  const previousFetch = globalThis.fetch;
  const previousUrl = process.env.PAYLOAD_ECOMMERCE_URL;
  process.env.PAYLOAD_ECOMMERCE_URL = "https://cms.example";
  globalThis.fetch = async () =>
    Response.json({ id: 2, currency: "ARS", items: [], purchasedAt: null });
  try {
    assert.equal((await getCart("2::nuevo"))?.id, "2::nuevo");
    globalThis.fetch = async () =>
      Response.json({ message: "No disponible" }, { status: 503 });
    await assert.rejects(getCart("2::nuevo"));
    globalThis.fetch = async () =>
      Response.json({ id: 2, currency: "ARS", items: [], status: "purchased" });
    assert.equal(await getCart("2::nuevo"), null);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.PAYLOAD_ECOMMERCE_URL;
    else process.env.PAYLOAD_ECOMMERCE_URL = previousUrl;
  }
});
