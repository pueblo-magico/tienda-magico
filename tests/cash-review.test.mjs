import test from "node:test";
import assert from "node:assert/strict";
import { cashReview } from "../src/features/checkout/cash-review.ts";

test("revisa el importe exacto sin confirmar el pago", () => {
  assert.deepEqual(cashReview(2000000, "20.000"), {
    total: 2000000,
    received: 2000000,
    change: 0,
  });
});

test("rechaza importes incompletos, diferentes e inválidos", () => {
  for (const value of ["", "0", "19999", "20001", "20,00", "abc"]) {
    assert.equal(cashReview(2000000, value), null);
  }
  assert.equal(cashReview(Number.NaN, "20000"), null);
});
