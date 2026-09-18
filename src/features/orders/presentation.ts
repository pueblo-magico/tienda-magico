import type { CheckoutOrder } from "@/types/commerce";
import { getTransferWaitingState } from "@/lib/checkout/transfer-waiting";

export function orderDisplayState(order: CheckoutOrder, now: number) {
  const state =
    order.paymentMethod === "bank-transfer" ||
    (order.paymentMethod === "cash" && Boolean(order.paymentExpiresAt))
      ? getTransferWaitingState(
          order.paymentStatus,
          order.paymentExpiresAt,
          now,
        ).status
      : order.paymentStatus;
  return order.transferReportedAt &&
    ["pending", "expired", "unverified"].includes(state)
    ? "reported"
    : state;
}

export type OrderFilter = "all" | ReturnType<typeof orderDisplayState>;

export function filterOrders(
  orders: CheckoutOrder[],
  filter: OrderFilter,
  now: number,
) {
  return filter === "all"
    ? orders
    : orders.filter((order) => orderDisplayState(order, now) === filter);
}
