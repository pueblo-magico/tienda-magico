import assert from "node:assert/strict";
import test from "node:test";
import { selectTransferOrder } from "../apps/cms/src/utilities/transferMatching.ts";

const payment = {
  payerType: "DNI",
  payerNumber: "1111111",
  amount: 10000,
  currency: "ARS",
  publicReference: null,
  approvedAt: "2026-09-16T12:05:00Z",
};
const order = {
  id: 1,
  transferIdentification: { type: "DNI", number: "1111111" },
  amount: 10000,
  currency: "ARS",
  publicReference: "ref",
  createdAt: "2026-09-16T12:00:00Z",
  paymentExpiresAt: "2026-09-16T12:15:00Z",
  paymentMethod: "bank-transfer",
};
test("solo concilia un candidato único con documento, importe, moneda y plazo coincidentes", () => {
  assert.equal(selectTransferOrder([order], payment), 1);
  for (const change of [
    { payerNumber: "2222222" },
    { payerType: "CUIT" },
    { amount: 9999 },
    { currency: "USD" },
    { approvedAt: "2026-09-16T12:16:00Z" },
    { approvedAt: "2026-09-16T11:59:00Z" },
    { publicReference: "otra" },
  ])
    assert.equal(selectTransferOrder([order], { ...payment, ...change }), null);
  assert.equal(
    selectTransferOrder([order, { ...order, id: 2 }], payment),
    null,
  );
  assert.equal(
    selectTransferOrder([{ ...order, transferIdentification: null }], payment),
    null,
  );
});
test("la referencia adicional no reemplaza el documento y puede resolver la ambigüedad", () => {
  assert.equal(
    selectTransferOrder([order, { ...order, id: 2, publicReference: "otra" }], {
      ...payment,
      publicReference: "ref",
    }),
    1,
  );
  assert.equal(
    selectTransferOrder([order], {
      ...payment,
      publicReference: "ref",
      payerNumber: "2222222",
    }),
    null,
  );
});
