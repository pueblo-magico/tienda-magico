import assert from "node:assert/strict";
import test from "node:test";
import { reconcileTransferEndpoint } from "../apps/cms/src/utilities/reconcileTransfer.ts";

function request(overrides = {}) {
  return {
    user: { id: 1, roles: ["admin"], _strategy: "api-key" },
    json: async () => ({ idempotencyKey: "a".repeat(64) }),
    payload: { findByID: async () => ({ roles: ["admin"] }) },
    ...overrides,
  };
}

test("rechaza anónimos, cookies y roles incorrectos sin consultar datos", async () => {
  for (const user of [
    null,
    { roles: ["admin"] },
    { roles: ["admin"], _strategy: "local-jwt" },
    { roles: ["customer"], _strategy: "api-key" },
  ]) {
    const result = await reconcileTransferEndpoint.handler(
      request({
        user,
        payload: { findByID: () => assert.fail("No debe consultar") },
      }),
    );
    assert.equal(result.status, 403);
  }
});

test("JSON malformado recibe 400 sin propagar excepciones", async () => {
  const response = await reconcileTransferEndpoint.handler(
    request({
      json: async () => {
        throw new SyntaxError("JSON");
      },
    }),
  );
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { code: "invalid" });
});

test("una falla de persistencia devuelve 503 sin exponer detalles", async () => {
  const req = request();
  req.payload.find = async () => {
    throw new Error("detalle privado");
  };
  const response = await reconcileTransferEndpoint.handler(req);
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { code: "unavailable" });
});

test("importe cero y cronología inválida no inician confirmación", async () => {
  for (const change of [
    { amount: 0 },
    { approvedAt: "2026-01-02T00:00:00Z" },
  ]) {
    let transactions = 0;
    let saved;
    const req = request();
    req.payload.find = async () => ({
      docs: [
        {
          id: 1,
          resourceId: "123",
          idempotencyKey: "a".repeat(64),
          paymentStatus: "approved",
          statusDetail: "accredited",
          paymentType: "bank_transfer",
          refundedAmount: 0,
          payerType: "DNI",
          payerNumber: "1111111",
          amount: 10000,
          currency: "ARS",
          approvedAt: "2026-01-01T00:00:00Z",
          providerUpdatedAt: "2026-01-01T00:00:00Z",
          ...change,
        },
      ],
    });
    req.payload.db = {
      beginTransaction: async () => {
        transactions++;
        throw new Error("No debe confirmar");
      },
    };
    req.payload.update = async ({ data }) => {
      saved = data;
    };
    assert.equal((await reconcileTransferEndpoint.handler(req)).status, 200);
    assert.equal(transactions, 0);
    assert.match(saved.reconciliation, /^manual_review:/);
  }
});
