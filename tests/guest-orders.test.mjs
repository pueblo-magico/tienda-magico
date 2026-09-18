import assert from "node:assert/strict";
import { test } from "node:test";
import { parseGuestCartReferences } from "../src/lib/commerce/guest-order-access.ts";
import * as orders from "../src/lib/commerce/providers/payload-ecommerce/orders.ts";

const cart = `1::${"a".repeat(40)}`;
test("las referencias públicas e IDs sin secreto no autorizan historial", () => {
  for (const value of [undefined, "broken", "{}", '["1"]', '["public-uuid"]']) {
    assert.deepEqual(parseGuestCartReferences(value), []);
  }
  assert.deepEqual(
    parseGuestCartReferences(JSON.stringify([cart, cart, "2::bad"])),
    [cart],
  );
});

test("sin credenciales no consulta pedidos", async () => {
  assert.deepEqual(await orders.getGuestOrders([]), []);
  assert.deepEqual(await orders.getGuestOrders(["1"]), []);
  assert.equal(await orders.reportGuestTransfer([], "ref"), false);
});

test("limita el tamaño del historial de carritos", () => {
  const refs = Array.from(
    { length: 30 },
    (_, index) => `${index + 1}::${"a".repeat(40)}`,
  );
  assert.deepEqual(
    parseGuestCartReferences(JSON.stringify(refs)),
    refs.slice(-20),
  );
});

test("declarar transferencia exige propiedad y solo guarda el aviso", async () => {
  const original = globalThis.fetch;
  const oldUrl = process.env.PAYLOAD_ECOMMERCE_URL;
  process.env.PAYLOAD_ECOMMERCE_URL = "https://cms.example";
  let reported = null;
  let writes = 0;
  const doc = {
    id: 1,
    publicReference: "owned",
    amount: 100,
    currency: "ARS",
    paymentMethod: "bank-transfer",
    paymentStatus: "pending",
  };
  globalThis.fetch = async (url, init) => {
    if (init.method === "PATCH") {
      writes++;
      const query = new URL(url).searchParams;
      assert.equal(query.get("where[and][1][cartReference][in]"), cart);
      assert.equal(
        query.get("where[and][0][publicReference][equals]"),
        "owned",
      );
      const body = JSON.parse(init.body);
      assert.deepEqual(Object.keys(body), ["transferReportedAt"]);
      reported = body.transferReportedAt;
      return Response.json({
        docs: [{ ...doc, transferReportedAt: reported }],
      });
    }
    return Response.json({ docs: [{ ...doc, transferReportedAt: reported }] });
  };
  try {
    assert.equal(
      await orders.reportGuestTransfer([cart], "another-order"),
      false,
    );
    assert.equal(writes, 0);
    assert.equal(await orders.reportGuestTransfer([cart], "owned"), true);
    assert.equal(await orders.reportGuestTransfer([cart], "owned"), true);
    assert.equal(writes, 1);
    assert.equal(doc.paymentStatus, "pending");
  } finally {
    globalThis.fetch = original;
    if (oldUrl === undefined) delete process.env.PAYLOAD_ECOMMERCE_URL;
    else process.env.PAYLOAD_ECOMMERCE_URL = oldUrl;
  }
});

test("el historial filtra por credencial completa y no devuelve secretos", async () => {
  const original = globalThis.fetch;
  const oldUrl = process.env.PAYLOAD_ECOMMERCE_URL;
  process.env.PAYLOAD_ECOMMERCE_URL = "https://cms.example";
  globalThis.fetch = async (url) => {
    assert.equal(
      new URL(url).searchParams.get("where[cartReference][in]"),
      cart,
    );
    return Response.json({
      docs: [
        {
          id: 1,
          publicReference: "ref",
          cartReference: cart,
          amount: 12300,
          currency: "ARS",
          paymentMethod: "bank-transfer",
          paymentStatus: "pending",
          buyerContact: { name: "Prueba", email: "test@example.com" },
        },
      ],
      hasNextPage: false,
    });
  };
  try {
    const result = await orders.getGuestOrders([cart]);
    assert.equal(result[0].total.amount, "123");
    assert.equal(JSON.stringify(result).includes(cart), false);
    assert.equal(JSON.stringify(result).includes("buyerContact"), false);
  } finally {
    globalThis.fetch = original;
    if (oldUrl === undefined) delete process.env.PAYLOAD_ECOMMERCE_URL;
    else process.env.PAYLOAD_ECOMMERCE_URL = oldUrl;
  }
});
