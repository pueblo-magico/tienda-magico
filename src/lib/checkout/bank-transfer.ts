import { BANK_TRANSFER, type CheckoutSession } from "@/types/checkout";

type CreateBankTransferSessionInput = {
  baseUrl: string;
  locale: string;
  orderId: string;
  paymentWindowMinutes: number;
  now?: Date;
  expiresAt?: string;
};

export function bankTransferExpiry(
  paymentWindowMinutes: number,
  now = new Date(),
): string {
  return new Date(now.getTime() + paymentWindowMinutes * 60_000).toISOString();
}

export function createBankTransferSession({
  baseUrl,
  locale,
  orderId,
  paymentWindowMinutes,
  now = new Date(),
  expiresAt = bankTransferExpiry(paymentWindowMinutes, now),
}: CreateBankTransferSessionInput): CheckoutSession {
  const query = new URLSearchParams({
    payment_method: BANK_TRANSFER,
    order: orderId,
  });

  return {
    id: `transfer:${orderId}`,
    provider: BANK_TRANSFER,
    redirectUrl: `${baseUrl}/${locale}/checkout/pending?${query}`,
    status: "pending",
    expiresAt,
  };
}
