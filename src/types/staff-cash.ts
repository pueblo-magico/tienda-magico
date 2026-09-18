export type StaffCashOrder = {
  reference: string;
  amount: number;
  currency: "ARS";
  status: "pending" | "unverified" | "approved" | "cancelled" | "rejected";
  buyerName: string | null;
};

export type StaffCashAction =
  "login" | "logout" | "session" | "order" | "confirm";

const errorCodes = new Set([
  "unauthorized",
  "origin",
  "invalid",
  "notFound",
  "amount",
  "state",
  "expired",
  "stock",
  "catalog",
  "duplicate",
  "localSale",
  "unavailable",
]);

export function staffCashErrorCode(value: unknown): string {
  return typeof value === "string" && errorCodes.has(value)
    ? value
    : "unavailable";
}

export function isStaffCashOrder(value: unknown): value is StaffCashOrder {
  if (!value || typeof value !== "object") return false;
  const order = value as Record<string, unknown>;
  return (
    typeof order.reference === "string" &&
    Number.isSafeInteger(order.amount) &&
    Number(order.amount) > 0 &&
    order.currency === "ARS" &&
    typeof order.status === "string" &&
    ["pending", "unverified", "approved", "cancelled", "rejected"].includes(
      order.status,
    ) &&
    (order.buyerName === null || typeof order.buyerName === "string")
  );
}
