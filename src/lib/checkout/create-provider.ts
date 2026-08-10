import type { CheckoutProvider } from "./provider";
import { commerceRedirectCheckoutProvider } from "./providers/commerce-redirect";
import { mercadoPagoCheckoutProvider } from "./providers/mercado-pago";
import type { CheckoutProviderName } from "@/types/checkout";
import { CheckoutConfigError } from "@/types/checkout";

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function resolveCheckoutProviderName(): CheckoutProviderName {
  const explicit = readEnv("CHECKOUT_PROVIDER")?.toLowerCase();

  if (explicit === "mercado-pago" || explicit === "mercadopago" || explicit === "mp") {
    return "mercado-pago";
  }
  if (
    explicit === "commerce-redirect" ||
    explicit === "commerce" ||
    explicit === "shopify"
  ) {
    return "commerce-redirect";
  }

  // Auto: prefer Mercado Pago when credentials exist.
  if (readEnv("MERCADOPAGO_ACCESS_TOKEN") || readEnv("MP_ACCESS_TOKEN")) {
    return "mercado-pago";
  }

  return "commerce-redirect";
}

export function createCheckoutProvider(
  name: CheckoutProviderName = resolveCheckoutProviderName(),
): CheckoutProvider {
  switch (name) {
    case "mercado-pago":
      return mercadoPagoCheckoutProvider;
    case "commerce-redirect":
      return commerceRedirectCheckoutProvider;
    default:
      throw new CheckoutConfigError(
        `Unknown CHECKOUT_PROVIDER "${String(name)}". Use mercado-pago or commerce-redirect.`,
      );
  }
}
