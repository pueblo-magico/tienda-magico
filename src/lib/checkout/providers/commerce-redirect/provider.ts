import type { CheckoutProvider } from "@/lib/checkout/provider";
import type { CheckoutSession, CreateCheckoutSessionInput } from "@/types/checkout";
import { CheckoutError } from "@/types/checkout";

function siteOrigin(): string {
  const env =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    "http://localhost:3000";
  try {
    return new URL(env).origin;
  } catch {
    return "http://localhost:3000";
  }
}

/**
 * True when checkoutUrl points at this storefront's /checkout entry
 * (Payload placeholder) rather than an external payment host.
 */
function isSelfHostedCheckoutEntry(checkoutUrl: string): boolean {
  try {
    const url = new URL(checkoutUrl, siteOrigin());
    const path = url.pathname.replace(/\/+$/, "") || "/";
    // /checkout or /en/checkout or /es/checkout — not success/failure/pending
    return /^(?:\/(?:en|es))?\/checkout$/.test(path);
  } catch {
    return /\/checkout\/?(\?|$)/.test(checkoutUrl);
  }
}

/**
 * Uses the commerce cart's built-in checkoutUrl (e.g. Shopify Checkout).
 * Rejects same-origin Payload placeholder URLs so the UI can require a
 * real payment provider (Mercado Pago, etc.).
 */
export class CommerceRedirectCheckoutProvider implements CheckoutProvider {
  readonly name = "commerce-redirect" as const;

  isConfigured(): boolean {
    return true;
  }

  async createCheckoutSession(
    input: CreateCheckoutSessionInput,
  ): Promise<CheckoutSession> {
    const redirectUrl = input.cart.checkoutUrl?.trim();
    if (!redirectUrl) {
      throw new CheckoutError(
        "Commerce cart has no checkoutUrl. Configure Shopify checkout or set CHECKOUT_PROVIDER=mercado-pago with MERCADOPAGO_ACCESS_TOKEN.",
        { provider: "commerce-redirect" },
      );
    }

    if (isSelfHostedCheckoutEntry(redirectUrl)) {
      throw new CheckoutError(
        "No external payment provider is configured. Set MERCADOPAGO_ACCESS_TOKEN (and CHECKOUT_PROVIDER=mercado-pago) to enable Mercado Pago Checkout.",
        { provider: "commerce-redirect" },
      );
    }

    return {
      id: input.cart.id || "commerce-checkout",
      provider: "commerce-redirect",
      redirectUrl,
      status: "ready",
    };
  }
}

export const commerceRedirectCheckoutProvider =
  new CommerceRedirectCheckoutProvider();
