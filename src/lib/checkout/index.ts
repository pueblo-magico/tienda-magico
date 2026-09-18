import { createCheckoutProvider } from "./create-provider";
import type { CheckoutProvider } from "./provider";
import { validateCheckoutCart } from "./validate-cart";

export type { CheckoutProvider } from "./provider";
export {
  createCheckoutProvider,
  resolveCheckoutProviderName,
} from "./create-provider";
export { mercadoPagoCheckoutProvider } from "./providers/mercado-pago";
export { commerceRedirectCheckoutProvider } from "./providers/commerce-redirect";

let cached: CheckoutProvider | null = null;

export function getCheckoutProvider(): CheckoutProvider {
  if (!cached) {
    cached = createCheckoutProvider();
  }
  return cached;
}

/** Test helper — reset cached provider instance. */
export function __resetCheckoutProviderForTests() {
  cached = null;
}

export const checkout = {
  get provider() {
    return getCheckoutProvider();
  },
  isConfigured: () => getCheckoutProvider().isConfigured(),
  createCheckoutSession: (
    ...args: Parameters<CheckoutProvider["createCheckoutSession"]>
  ) => {
    validateCheckoutCart(args[0].cart, args[0].locale);
    return getCheckoutProvider().createCheckoutSession(...args);
  },
  getPayment: (paymentId: string) => {
    const provider = getCheckoutProvider();
    if (!provider.getPayment) {
      return Promise.resolve(null);
    }
    return provider.getPayment(paymentId);
  },
};
export { receivePaymentNotification } from "./receive-notification";
