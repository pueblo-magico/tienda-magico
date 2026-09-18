import assert from "node:assert/strict";
import test from "node:test";
import { validateCheckoutCustomer } from "../src/lib/checkout/customer.ts";
import { normalizeTransferIdentification } from "../src/lib/checkout/transfer-identification.ts";
import { normalizeTransferIdentification as normalizeCms } from "../apps/cms/src/utilities/transferIdentification.ts";

test("la transferencia exige documento válido sin alterar otros medios", () => {
  const buyer = { name: "Prueba", email: "buyer@example.test" };
  assert.throws(() => validateCheckoutCustomer(buyer, "es", "bank-transfer"));
  assert.deepEqual(
    validateCheckoutCustomer(buyer, "es", "mercado-pago"),
    buyer,
  );
  assert.deepEqual(
    validateCheckoutCustomer(
      { ...buyer, identification: { type: "DNI", number: "11.111.111" } },
      "es",
      "bank-transfer",
    ).identification,
    { type: "DNI", number: "11111111" },
  );
});

test("normaliza formato sin inventar o convertir identificaciones", () => {
  assert.deepEqual(
    normalizeTransferIdentification({ type: " dni ", number: "1.111.111" }),
    { type: "DNI", number: "1111111" },
  );
  assert.deepEqual(
    normalizeTransferIdentification({ type: "CUIL", number: "20-12345678-9" }),
    { type: "CUIL", number: "20123456789" },
  );
  for (const value of [
    null,
    {},
    { type: "DNI", number: 1111111 },
    { type: "DNI", number: "abc1111111" },
    { type: "DNI", number: "123" },
    { type: "CUIT", number: "1234567" },
  ])
    assert.equal(normalizeTransferIdentification(value), null);
});

test("los normalizadores independientes del CMS y storefront mantienen paridad", () => {
  for (const type of ["DNI", "dni", "CUIT", "CUIL", "passport", null]) {
    for (const number of [
      "1.111.111",
      "20-12345678-9",
      "0000001",
      "123",
      "abc",
      null,
      1111111,
    ]) {
      assert.deepEqual(
        normalizeCms({ type, number }),
        normalizeTransferIdentification({ type, number }),
      );
    }
  }
});
