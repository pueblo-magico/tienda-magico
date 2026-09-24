import assert from "node:assert/strict";
import { test } from "node:test";
import { parseGuestCartReferences } from "../src/lib/commerce/guest-order-access.ts";
import * as orders from "../src/lib/commerce/providers/payload-ecommerce/orders.ts";

const cart = `1::${"a".repeat(40)}`;
test("cancelar efectivo exige pertenencia y rechaza pagos aprobados", async () => {
  const previousFetch = globalThis.fetch;
  const previousUrl = process.env.PAYLOAD_ECOMMERCE_URL;
  process.env.PAYLOAD_ECOMMERCE_URL = "https://cms.example";
  let status = "pending";
  let writes = 0;
  globalThis.fetch = async (url, init = {}) => {
    if (init.method === "POST") {
      assert.equal(new URL(url).pathname, "/api/orders/1/cancel-cash");
      writes++;
      return Response.json({ cancelled: true });
    }
    assert.equal(
      new URL(url).searchParams.get("where[cartReference][in]"),
      cart,
    );
    return Response.json({
      docs: [
        {
          id: 1,
          publicReference: "owned",
          paymentMethod: "cash",
          paymentStatus: status,
          amount: 100,
          currency: "ARS",
          cartReference: cart,
        },
      ],
    });
  };
  try {
    assert.equal(await orders.cancelGuestCashOrder([], "owned"), false);
    assert.equal(await orders.cancelGuestCashOrder([cart], "other"), false);
    assert.equal(await orders.cancelGuestCashOrder([cart], "owned"), true);
    status = "approved";
    assert.equal(await orders.cancelGuestCashOrder([cart], "owned"), false);
    assert.equal(writes, 1);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.PAYLOAD_ECOMMERCE_URL;
    else process.env.PAYLOAD_ECOMMERCE_URL = previousUrl;
  }
});
test("la opinión se guarda sin confirmar recepción y la recepción no guarda una opinión", async () => {
  const previousFetch = globalThis.fetch;
  const previousUrl = process.env.PAYLOAD_ECOMMERCE_URL;
  process.env.PAYLOAD_ECOMMERCE_URL = "https://cms.example";
  const saved = {
    id: 1,
    publicReference: "owned",
    paymentStatus: "approved",
    paymentMethod: "cash",
    amount: 100,
    currency: "ARS",
    cartReference: cart,
  };
  const writes = [];
  globalThis.fetch = async (url, init = {}) => {
    if (init.method === "PATCH") {
      const body = JSON.parse(init.body);
      writes.push(body);
      Object.assign(saved, body);
      return Response.json({ doc: saved });
    }
    return Response.json({ docs: [saved] });
  };
  try {
    assert.equal(
      await orders.submitGuestOrderFeedback([cart], "owned", {
        rating: 4,
        comment: "Bien",
      }),
      true,
    );
    assert.equal(saved.receivedAt, undefined);
    assert.equal(await orders.confirmGuestOrderReceipt([cart], "owned"), true);
    assert.deepEqual(Object.keys(writes[1]), ["receivedAt"]);
    assert.equal(saved.experienceRating, 4);
    assert.equal(
      await orders.submitGuestOrderFeedback([cart], "owned", { rating: 1 }),
      true,
    );
    assert.equal(writes.length, 2);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.PAYLOAD_ECOMMERCE_URL;
    else process.env.PAYLOAD_ECOMMERCE_URL = previousUrl;
  }
});
test("una recepción concurrente conserva la primera reseña y un fallo real se propaga", async () => {
  const original = globalThis.fetch;
  const oldUrl = process.env.PAYLOAD_ECOMMERCE_URL;
  process.env.PAYLOAD_ECOMMERCE_URL = "https://cms.example";
  let receivedAt = null;
  let concurrent = true;
  globalThis.fetch = async (url, init = {}) => {
    if (init.method === "PATCH") {
      assert.equal(new URL(url).pathname, "/api/orders/1");
      if (concurrent) receivedAt = "2026-09-17T12:00:00.000Z";
      return Response.json(
        { errors: [{ message: "Conflict" }] },
        { status: 409 },
      );
    }
    return Response.json({
      docs: [
        {
          id: 1,
          publicReference: "owned",
          cartReference: cart,
          paymentStatus: "approved",
          paymentMethod: "cash",
          amount: 100,
          currency: "ARS",
          receivedAt,
        },
      ],
    });
  };
  try {
    assert.equal(
      await orders.confirmGuestOrderReceipt([cart], "owned", { rating: 4 }),
      true,
    );
    receivedAt = null;
    concurrent = false;
    await assert.rejects(
      orders.confirmGuestOrderReceipt([cart], "owned", { rating: 4 }),
    );
  } finally {
    globalThis.fetch = original;
    if (oldUrl === undefined) delete process.env.PAYLOAD_ECOMMERCE_URL;
    else process.env.PAYLOAD_ECOMMERCE_URL = oldUrl;
  }
});
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
  assert.equal(
    await orders.confirmGuestOrderReceipt([], "ref", {
      rating: 5,
      comment: "Excelente",
    }),
    false,
  );
});

test("confirmar recepción exige propiedad y pago aprobado", async () => {
  const original = globalThis.fetch;
  const oldUrl = process.env.PAYLOAD_ECOMMERCE_URL;
  process.env.PAYLOAD_ECOMMERCE_URL = "https://cms.example";
  let writes = 0;
  const approved = {
    id: 1,
    publicReference: "approved-order",
    cartReference: cart,
    amount: 100,
    currency: "ARS",
    paymentMethod: "cash",
    paymentStatus: "approved",
  };
  globalThis.fetch = async (url, init = {}) => {
    if (init.method === "PATCH") {
      writes++;
      assert.equal(new URL(url).pathname, "/api/orders/1");
      assert.equal(new URL(url).search, "");
      const body = JSON.parse(init.body);
      assert.equal(typeof body.receivedAt, "string");
      assert.deepEqual(
        { rating: body.experienceRating, comment: body.experienceComment },
        { rating: 4, comment: "Muy buena atención." },
      );
      return Response.json({ doc: { ...approved, ...body } });
    }
    return Response.json({ docs: [approved], hasNextPage: false });
  };
  try {
    assert.equal(
      await orders.confirmGuestOrderReceipt([cart], "another-order", {
        rating: 4,
        comment: "Muy buena atención.",
      }),
      false,
    );
    assert.equal(writes, 0);
    assert.equal(
      await orders.confirmGuestOrderReceipt([cart], approved.publicReference, {
        rating: 4,
        comment: "  Muy buena atención.  ",
      }),
      true,
    );
    assert.equal(writes, 1);
  } finally {
    globalThis.fetch = original;
    if (oldUrl === undefined) delete process.env.PAYLOAD_ECOMMERCE_URL;
    else process.env.PAYLOAD_ECOMMERCE_URL = oldUrl;
  }
});

test("la recepción es idempotente y no sobrescribe una reseña guardada", async () => {
  const original = globalThis.fetch;
  const oldUrl = process.env.PAYLOAD_ECOMMERCE_URL;
  process.env.PAYLOAD_ECOMMERCE_URL = "https://cms.example";
  let writes = 0;
  globalThis.fetch = async (_url, init = {}) => {
    if (init.method === "PATCH") writes++;
    return Response.json({
      docs: [
        {
          id: 1,
          publicReference: "received-order",
          cartReference: cart,
          amount: 100,
          currency: "ARS",
          paymentMethod: "cash",
          paymentStatus: "approved",
          receivedAt: "2026-09-17T12:00:00.000Z",
          experienceRating: 5,
          experienceComment: "Original",
        },
      ],
      hasNextPage: false,
    });
  };
  try {
    assert.equal(
      await orders.confirmGuestOrderReceipt([cart], "received-order", {
        rating: 1,
        comment: "Replacement",
      }),
      true,
    );
    assert.equal(writes, 0);
  } finally {
    globalThis.fetch = original;
    if (oldUrl === undefined) delete process.env.PAYLOAD_ECOMMERCE_URL;
    else process.env.PAYLOAD_ECOMMERCE_URL = oldUrl;
  }
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
test("el historial de cuenta consulta más de veinte carritos en lotes acotados", async () => {
  const previousFetch = globalThis.fetch;
  const previousUrl = process.env.PAYLOAD_ECOMMERCE_URL;
  process.env.PAYLOAD_ECOMMERCE_URL = "https://cms.example";
  const references = Array.from(
    { length: 43 },
    (_, index) => `${index + 1}::${"a".repeat(40)}`,
  );
  const queried = [];
  globalThis.fetch = async (url) => {
    const batch = new URL(url).searchParams
      .get("where[cartReference][in]")
      .split(",");
    assert.ok(batch.length <= 20);
    queried.push(...batch);
    return Response.json({ docs: [], hasNextPage: false });
  };
  try {
    assert.deepEqual(await orders.getGuestOrders(references), []);
    assert.deepEqual(queried, references);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.PAYLOAD_ECOMMERCE_URL;
    else process.env.PAYLOAD_ECOMMERCE_URL = previousUrl;
  }
});
