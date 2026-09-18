import assert from "node:assert/strict";
import { test } from "node:test";
import { parseOrderReceiptInput } from "../src/lib/checkout/order-receipt.ts";

const reference = "42575b2c-37f9-403c-9d32-99648ba63f9f";

test("acepta puntuaciones enteras de 0 a 5 y comentario opcional", () => {
  assert.deepEqual(
    parseOrderReceiptInput({
      action: "confirm-receipt",
      reference,
      rating: 0,
    }),
    { reference, rating: 0 },
  );
  assert.deepEqual(
    parseOrderReceiptInput({
      action: "confirm-receipt",
      reference: ` ${reference} `,
      rating: 5,
      comment: "  Excelente atención.  ",
    }),
    { reference, rating: 5, comment: "Excelente atención." },
  );
});

test("rechaza referencias, puntuaciones y comentarios inválidos", () => {
  for (const input of [
    null,
    {},
    { action: "another", reference, rating: 5 },
    { action: "confirm-receipt", reference: "public", rating: 5 },
    { action: "confirm-receipt", reference, rating: -1 },
    { action: "confirm-receipt", reference, rating: 6 },
    { action: "confirm-receipt", reference, rating: 4.5 },
    { action: "confirm-receipt", reference, rating: 5, comment: 12 },
    {
      action: "confirm-receipt",
      reference,
      rating: 5,
      comment: "a".repeat(1001),
    },
  ]) {
    assert.equal(parseOrderReceiptInput(input), null);
  }
});
