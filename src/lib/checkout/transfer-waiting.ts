import type { CheckoutOrder } from "@/types/commerce";

export function getTransferWaitingState(
  paymentStatus: unknown,
  expiresAt: string | null | undefined,
  now: number,
): {
  status: CheckoutOrder["paymentStatus"] | "expired";
  remainingSeconds: number;
  canPay: boolean;
} {
  if (
    paymentStatus === "approved" ||
    paymentStatus === "rejected" ||
    paymentStatus === "cancelled" ||
    paymentStatus === "unverified"
  ) {
    return { status: paymentStatus, remainingSeconds: 0, canPay: false };
  }
  if (paymentStatus !== "pending" || !Number.isFinite(now)) {
    return { status: "unverified", remainingSeconds: 0, canPay: false };
  }
  const deadline = expiresAt ? Date.parse(expiresAt) : Number.NaN;
  if (!Number.isFinite(deadline)) {
    return { status: "unverified", remainingSeconds: 0, canPay: false };
  }
  const remainingSeconds = Math.max(0, Math.ceil((deadline - now) / 1000));
  return {
    status: remainingSeconds > 0 ? "pending" : "expired",
    remainingSeconds,
    canPay: remainingSeconds > 0,
  };
}
