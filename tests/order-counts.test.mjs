import assert from "node:assert/strict";
import test from "node:test";
import { orderCounts } from "../src/lib/checkout/order-counts.ts";

test("cuenta pagos pendientes vigentes sin incluir pagos aprobados ni pedidos reemplazados", () => {
  assert.deepEqual(
    orderCounts(
      [
        { paymentStatus: "pending" },
        { paymentStatus: "pending", paymentExpiresAt: "2026-09-20T00:00:00Z" },
        { paymentStatus: "approved" },
        { paymentStatus: "cancelled" },
        { paymentStatus: "pending", newerReference: "new" },
        {
          paymentStatus: "pending",
          transferReportedAt: "2026-09-18T00:00:00Z",
        },
        { paymentStatus: "pending", paymentExpiresAt: "2026-09-17T00:00:00Z" },
      ],
      Date.parse("2026-09-18T00:00:00Z"),
    ),
    { pendingCount: 2, approvedCount: 1 },
  );
});
