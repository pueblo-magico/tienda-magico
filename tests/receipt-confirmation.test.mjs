import test from "node:test";
import assert from "node:assert/strict";
import { receiptConfirmationBody } from "../src/features/orders/receipt-confirmation.ts";

test("no envía recepción sin confirmación explícita", () => {
  assert.equal(receiptConfirmationBody("order-reference", false), null);
});
test("confirma recepción sin modificar la opinión", () => {
  assert.deepEqual(receiptConfirmationBody("order-reference", true), {
    action: "confirm-receipt",
    reference: "order-reference",
  });
});
