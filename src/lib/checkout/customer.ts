import type { CheckoutCustomer } from "@/types/checkout";

export class CheckoutCustomerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CheckoutCustomerError";
  }
}

export function validateCheckoutCustomer(
  customer: CheckoutCustomer,
  locale?: string | null,
): Required<Pick<CheckoutCustomer, "name" | "email">> {
  const name = customer.name?.trim() ?? "";
  const email = customer.email?.trim().toLowerCase() ?? "";
  const isSpanish = locale?.toLowerCase().startsWith("es");

  if (!name || !email) {
    throw new CheckoutCustomerError(
      isSpanish
        ? "Ingresá tu nombre y tu email antes de pagar."
        : "Enter your name and email before checkout.",
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new CheckoutCustomerError(
      isSpanish ? "Ingresá un email válido." : "Enter a valid email address.",
    );
  }

  return { name, email };
}
