import type {
  CheckoutPayment,
  CheckoutProviderName,
  CheckoutSession,
  CreateCheckoutSessionInput,
} from "@/types/checkout";

/**
 * Provider-agnostic checkout / payments contract.
 * Swap Mercado Pago, Stripe, PayPal, commerce-native checkout, etc.
 */
export interface CheckoutProvider {
  readonly name: CheckoutProviderName;

  isConfigured(): boolean;

  /** Create a hosted checkout session and return a redirect URL. */
  createCheckoutSession(
    input: CreateCheckoutSessionInput,
  ): Promise<CheckoutSession>;

  /**
   * Optional: resolve a payment after return / webhook.
   * Providers that only redirect may omit this.
   */
  getPayment?(paymentId: string): Promise<CheckoutPayment | null>;
}
