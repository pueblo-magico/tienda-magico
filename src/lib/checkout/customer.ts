import type { CheckoutCustomer } from "@/types/checkout";
import { normalizeTransferIdentification } from "./transfer-identification";

export class CheckoutCustomerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CheckoutCustomerError";
  }
}

export function validateCheckoutCustomer(
  customer: CheckoutCustomer,
  locale?: string | null,
  paymentMethod?: string,
): Required<Pick<CheckoutCustomer, "name" | "email">> &
  Pick<CheckoutCustomer, "identification"> {
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

  if (paymentMethod === "bank-transfer") {
    const identification = normalizeTransferIdentification(
      customer.identification,
    );
    if (!identification)
      throw new CheckoutCustomerError(
        isSpanish
          ? "Ingresá el tipo y número de documento del titular de la cuenta desde la que vas a transferir."
          : "Enter the identification type and number of the account holder sending the transfer.",
      );
    return { name, email, identification };
  }
  return { name, email };
}
