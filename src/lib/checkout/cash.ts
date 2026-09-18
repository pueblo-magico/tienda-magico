import { CASH, type CheckoutSession } from "@/types/checkout";
import { localizePath } from "@/config/navigation";

export function createCashSession({
  baseUrl,
  locale,
  orderId,
}: {
  baseUrl: string;
  locale: string;
  orderId: string;
}): CheckoutSession {
  const query = new URLSearchParams({
    payment_method: CASH,
    order: orderId,
    from: "cart",
  });

  return {
    id: `cash:${orderId}`,
    provider: CASH,
    redirectUrl: `${baseUrl}${localizePath(locale, `/checkout/pending?${query}`)}`,
    status: "pending",
    expiresAt: null,
  };
}
