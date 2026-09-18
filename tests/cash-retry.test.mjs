import assert from "node:assert/strict";
import test from "node:test";
import { createCheckoutOrder } from "../src/lib/commerce/providers/payload-ecommerce/orders.ts";

test("efectivo: reutiliza envíos iguales y reemplaza un pedido si cambia el carrito", async () => {
  const previousFetch = globalThis.fetch;
  const previousUrl = process.env.PAYLOAD_ECOMMERCE_URL;
  const previousKey = process.env.PAYLOAD_ECOMMERCE_API_KEY;
  process.env.PAYLOAD_ECOMMERCE_URL = "https://cms.example";
  process.env.PAYLOAD_ECOMMERCE_API_KEY = "test";
  const orders = new Map();
  globalThis.fetch = async (url, init) => {
    if (init.method === "POST") {
      const input = JSON.parse(init.body);
      if (orders.has(input.checkoutKey))
        return Response.json({}, { status: 409 });
      const doc = {
        ...input,
        id: orders.size + 1,
        publicReference: `pedido-${orders.size + 1}`,
      };
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
      cost: { totalAmount: { amount: "100", currencyCode: "ARS" } },
    };
    const options = { paymentMethod: "cash" };
    const original = await createCheckoutOrder(cart, {}, options);
    assert.equal(
      (await createCheckoutOrder(cart, {}, options)).id,
      original.id,
    );
    cart.cost.totalAmount.amount = "200";
    const [replacement, retry] = await Promise.all([
      createCheckoutOrder(cart, {}, options),
      createCheckoutOrder(cart, {}, options),
    ]);
    assert.notEqual(replacement.id, original.id);
    assert.equal(replacement.id, retry.id);
    assert.equal(replacement.total.amount, "200");
    assert.equal(orders.size, 2);
    const persisted = [...orders.values()].at(-1);
    persisted.commercialSnapshot = Object.fromEntries(
      Object.entries(persisted.commercialSnapshot).reverse(),
    );
    assert.equal(
      (await createCheckoutOrder(cart, {}, options)).id,
      replacement.id,
    );
    const customer = {
      name: "Cliente de prueba",
      email: "cliente@example.test",
    };
    const changedCustomer = await createCheckoutOrder(cart, customer, options);
    assert.notEqual(changedCustomer.id, replacement.id);
    assert.equal(
      (await createCheckoutOrder(cart, customer, options)).id,
      changedCustomer.id,
    );
    const current = [...orders.values()].at(-1);
    for (const paymentStatus of ["approved", "unverified"]) {
      current.paymentStatus = paymentStatus;
      cart.cost.totalAmount.amount = "300";
      assert.equal(
        (await createCheckoutOrder(cart, customer, options)).id,
        current.id.toString(),
      );
      assert.equal(orders.size, 3);
    }
    for (const paymentStatus of ["cancelled", "rejected"]) {
      [...orders.values()].at(-1).paymentStatus = paymentStatus;
      const retry = await createCheckoutOrder(cart, customer, options);
      assert.equal(retry.paymentStatus, "pending");
      assert.equal(retry.total.amount, "300");
    }
    const expiring = [...orders.values()].at(-1);
    expiring.paymentExpiresAt = "2000-01-01T00:00:00.000Z";
    const renewed = await createCheckoutOrder(cart, customer, options);
    assert.notEqual(renewed.id, String(expiring.id));
    assert.equal(
      (await createCheckoutOrder(cart, customer, options)).id,
      renewed.id,
    );
    const competing = await Promise.allSettled([
      createCheckoutOrder(
        {
          ...cart,
          cost: { totalAmount: { amount: "400", currencyCode: "ARS" } },
        },
        customer,
        options,
      ),
      createCheckoutOrder(
        {
          ...cart,
          cost: { totalAmount: { amount: "500", currencyCode: "ARS" } },
        },
        customer,
        options,
      ),
    ]);
    assert.equal(
      competing.filter((result) => result.status === "fulfilled").length,
      1,
    );
    const rejected = competing.find((result) => result.status === "rejected");
    assert.match(rejected.reason.message, /carrito cambió/);
    const unitPrice = { amount: "300", currencyCode: "ARS" };
    cart.lines = [
      {
        quantity: 1,
        cost: { amountPerQuantity: unitPrice, totalAmount: unitPrice },
        merchandise: {
          id: "product:42",
          title: "Producto",
          sku: "PRUEBA-42",
          selectedOptions: [],
          product: { id: "42", title: "Producto" },
        },
      },
    ];
    const firstProduct = await createCheckoutOrder(cart, customer, options);
    cart.lines[0].merchandise = {
      ...cart.lines[0].merchandise,
      id: "product:43",
      sku: "PRUEBA-43",
      product: { id: "43", title: "Otro producto" },
    };
    const otherProduct = await createCheckoutOrder(cart, customer, options);
    assert.notEqual(otherProduct.id, firstProduct.id);
    assert.equal(otherProduct.total.amount, firstProduct.total.amount);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.PAYLOAD_ECOMMERCE_URL;
    else process.env.PAYLOAD_ECOMMERCE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.PAYLOAD_ECOMMERCE_API_KEY;
    else process.env.PAYLOAD_ECOMMERCE_API_KEY = previousKey;
  }
});
