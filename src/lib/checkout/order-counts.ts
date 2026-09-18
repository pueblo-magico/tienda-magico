import type { CheckoutOrder } from "@/types/commerce";

export function orderCounts(orders: CheckoutOrder[], now = Date.now()) {
  return {
    pendingCount: orders.filter(
      (order) =>
        order.paymentStatus === "pending" &&
        !order.newerReference &&
        !order.transferReportedAt &&
        (!order.paymentExpiresAt || Date.parse(order.paymentExpiresAt) > now),
    ).length,
    approvedCount: orders.filter((order) => order.paymentStatus === "approved")
      .length,
  };
}
