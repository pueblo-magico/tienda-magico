import { hasCheckoutReview } from "@/lib/checkout/review";

export type CheckoutSessionResponse = {
  session?: {
    id: string;
    provider: string;
    redirectUrl: string;
    status: string;
    expiresAt?: string | null;
  };
  error?: string;
  configured?: boolean;
  provider?: string;
};

export async function createCheckoutSession(input: {
  cartId: string;
  locale?: string;
  email?: string;
  name?: string;
  identification?: { type: string; number: string };
  paymentMethod?: "mercado-pago" | "bank-transfer" | "cash";
  acceptedTerms?: boolean;
  reviewedCart?: string;
}): Promise<CheckoutSessionResponse> {
  if (!hasCheckoutReview(input))
    throw new Error(
      input.locale?.startsWith("es")
        ? "Revisá tu compra y aceptá los términos antes de confirmar."
        : "Review your purchase and accept the terms before confirming.",
    );
  const response = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = (await response.json()) as CheckoutSessionResponse;
  if (!response.ok) {
    throw new Error(data.error || `Checkout failed (${response.status})`);
  }
  return data;
}
