import assert from "node:assert/strict";
import { test } from "node:test";
import { createCheckoutOrder } from "../src/lib/commerce/providers/payload-ecommerce/orders.ts";

test("el mismo carrito renueva un intento vencido y reutiliza el nuevo intento", async () => {
  const previousFetch = globalThis.fetch;
  const previousUrl = process.env.PAYLOAD_ECOMMERCE_URL;
  const previousKey = process.env.PAYLOAD_ECOMMERCE_API_KEY;
  process.env.PAYLOAD_ECOMMERCE_URL = "https://cms.example";
  process.env.PAYLOAD_ECOMMERCE_API_KEY = "test";
  const baseKey = "checkout:1::test:bank-transfer";
  const expired = {
    id: 4,
    publicReference: "old-reference",
    paymentMethod: "bank-transfer",
    paymentStatus: "pending",
    paymentExpiresAt: "2000-01-01T00:00:00.000Z",
    amount: 10000,
    currency: "ARS",
  };
  const orders = new Map([[baseKey, expired]]);
  const writes = [];
  globalThis.fetch = async (url, init) => {
    if (init.method === "POST") {
      const input = JSON.parse(init.body);
      if (orders.has(input.checkoutKey))
        return Response.json({ message: "duplicate" }, { status: 409 });
      writes.push(input);
      const doc = { ...input, id: 5, publicReference: "new-reference" };
      orders.set(input.checkoutKey, doc);
      return Response.json({ doc });
    }
    const key = new URL(url).searchParams.get("where[checkoutKey][equals]");
    return Response.json({ docs: orders.has(key) ? [orders.get(key)] : [] });
  };
  try {
    const cart = {
      id: "1::test",
      fulfillmentMode: "local_collection",
      lines: [],
      cost: { totalAmount: { amount: "200", currencyCode: "ARS" } },
    };
    const options = {
      paymentMethod: "bank-transfer",
      paymentExpiresAt: "2099-01-01T00:00:00.000Z",
    };
    for (const status of ["approved", "unverified"]) {
      expired.paymentStatus = status;
      assert.equal(
        (await createCheckoutOrder(cart, {}, options)).publicReference,
        "old-reference",
      );
      assert.equal(writes.length, 0);
    }
    expired.paymentStatus = "pending";
    const results = await Promise.all([
      createCheckoutOrder(
        cart,
        { name: "Prueba", email: "test@example.com" },
        options,
      ),
      createCheckoutOrder(
        cart,
        { name: "Prueba", email: "test@example.com" },
        options,
      ),
    ]);
    const first = results[0];
    assert.equal(results[1].publicReference, first.publicReference);
    assert.equal(first.publicReference, "new-reference");
    assert.equal(first.total.amount, "200");
    assert.equal(
      (await createCheckoutOrder(cart, {}, options)).publicReference,
      first.publicReference,
    );
    assert.equal(writes.length, 1);
    assert.equal(orders.get(baseKey), expired);
    assert.equal(expired.paymentExpiresAt, "2000-01-01T00:00:00.000Z");
  } finally {
    globalThis.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.PAYLOAD_ECOMMERCE_URL;
    else process.env.PAYLOAD_ECOMMERCE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.PAYLOAD_ECOMMERCE_API_KEY;
    else process.env.PAYLOAD_ECOMMERCE_API_KEY = previousKey;
  }
});
