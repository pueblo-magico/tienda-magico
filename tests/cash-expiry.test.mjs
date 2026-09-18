import assert from "node:assert/strict";
import { test } from "node:test";
import { orderDisplayState } from "../src/features/orders/presentation.ts";

test("el efectivo vence al alcanzar su plazo sin ocultar un pago confirmado", () => {
  const now = Date.parse("2026-09-18T12:00:00Z");
  const order = {
    paymentMethod: "cash",
    paymentStatus: "pending",
    paymentExpiresAt: new Date(now).toISOString(),
  };
  assert.equal(orderDisplayState(order, now), "expired");
  assert.equal(orderDisplayState(order, now - 1), "pending");
  assert.equal(
    orderDisplayState({ ...order, paymentStatus: "approved" }, now),
    "approved",
  );
  assert.equal(
    orderDisplayState({ ...order, paymentExpiresAt: null }, now),
    "pending",
  );
});
