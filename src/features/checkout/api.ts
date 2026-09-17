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
  paymentMethod?: "mercado-pago" | "bank-transfer";
}): Promise<CheckoutSessionResponse> {
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
