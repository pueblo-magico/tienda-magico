import type { Cart, Money } from "./commerce";

export type CheckoutProviderName = "mercado-pago" | "commerce-redirect";

export type CheckoutItem = {
  id: string;
  title: string;
  quantity: number;
  unitPrice: Money;
  pictureUrl?: string | null;
  description?: string | null;
};

export type CheckoutCustomer = {
  email?: string | null;
  name?: string | null;
  phone?: string | null;
};

export type CheckoutReturnUrls = {
  success: string;
  failure: string;
  pending: string;
};

export type CreateCheckoutSessionInput = {
  cart: Cart;
  locale?: string | null;
  customer?: CheckoutCustomer;
  returnUrls: CheckoutReturnUrls;
  /** Merchant reference (defaults to cart.id). */
  externalReference?: string;
  metadata?: Record<string, string>;
  notificationUrl?: string | null;
};

export type CheckoutSession = {
  id: string;
  provider: CheckoutProviderName;
  /** URL the browser should navigate to complete payment. */
  redirectUrl: string;
  status: "ready" | "pending";
  expiresAt?: string | null;
  raw?: unknown;
};

export type CheckoutPaymentStatus =
  | "unknown"
  | "pending"
  | "approved"
  | "authorized"
  | "in_process"
  | "in_mediation"
  | "rejected"
  | "cancelled"
  | "refunded"
  | "charged_back";

export type CheckoutPayment = {
  id: string;
  provider: CheckoutProviderName;
  status: CheckoutPaymentStatus;
  externalReference?: string | null;
  amount?: Money | null;
  raw?: unknown;
};

export class CheckoutError extends Error {
  readonly provider?: CheckoutProviderName;
  readonly status?: number;
  readonly errors?: unknown;

  constructor(
    message: string,
    options?: {
      provider?: CheckoutProviderName;
      status?: number;
      errors?: unknown;
    },
  ) {
    super(message);
    this.name = "CheckoutError";
    this.provider = options?.provider;
    this.status = options?.status;
    this.errors = options?.errors;
  }
}

export class CheckoutConfigError extends CheckoutError {
  constructor(message: string, provider?: CheckoutProviderName) {
    super(message, { provider });
    this.name = "CheckoutConfigError";
  }
}
