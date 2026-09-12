import type { CheckoutProvider } from "@/lib/checkout/provider";
import type {
  CheckoutPayment,
  CheckoutPaymentStatus,
  CheckoutSession,
  CreateCheckoutSessionInput,
} from "@/types/checkout";
import { CheckoutError } from "@/types/checkout";
import { mercadoPagoFetch } from "./client";
import { getMercadoPagoConfig, isMercadoPagoConfigured } from "./config";
import { cartToPreferenceItems } from "./map-cart";

type PreferenceResponse = {
  id?: string;
  init_point?: string;
  sandbox_init_point?: string;
  date_of_expiration?: string | null;
  [key: string]: unknown;
};

type PaymentResponse = {
  id?: string | number;
  status?: string;
  external_reference?: string | null;
  transaction_amount?: number;
  currency_id?: string;
  [key: string]: unknown;
};

/** Mercado Pago only accepts auto_return / notification_url on public HTTPS. */
function isPublicHttpsUrl(value?: string | null): boolean {
  if (!value?.trim()) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host === "::1" ||
      host.endsWith(".local") ||
      host.endsWith(".internal")
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function mapPaymentStatus(status?: string | null): CheckoutPaymentStatus {
  switch ((status ?? "").toLowerCase()) {
    case "pending":
      return "pending";
    case "approved":
      return "approved";
    case "authorized":
      return "authorized";
    case "in_process":
      return "in_process";
    case "in_mediation":
      return "in_mediation";
    case "rejected":
      return "rejected";
    case "cancelled":
      return "cancelled";
    case "refunded":
      return "refunded";
    case "charged_back":
      return "charged_back";
    default:
      return "unknown";
  }
}

export class MercadoPagoCheckoutProvider implements CheckoutProvider {
  readonly name = "mercado-pago" as const;

  isConfigured(): boolean {
    return isMercadoPagoConfigured();
  }

  async createCheckoutSession(
    input: CreateCheckoutSessionInput,
  ): Promise<CheckoutSession> {
    if (!this.isConfigured()) {
      throw new CheckoutError(
        "Mercado Pago is not configured. Set MERCADOPAGO_ACCESS_TOKEN.",
        { provider: "mercado-pago" },
      );
    }

    const config = getMercadoPagoConfig();
    const items = cartToPreferenceItems(input.cart);
    const externalReference =
      input.externalReference?.trim() || input.cart.id || `cart-${Date.now()}`;

    const backUrls = {
      success: input.returnUrls.success,
      failure: input.returnUrls.failure,
      pending: input.returnUrls.pending,
    };

    const body: Record<string, unknown> = {
      items,
      external_reference: externalReference.slice(0, 256),
      back_urls: backUrls,
      metadata: {
        cart_id: input.cart.id,
        locale: input.locale ?? "",
        ...(input.metadata ?? {}),
      },
    };

    // MP rejects auto_return unless back_urls.success is a public HTTPS URL
    // (localhost / private hosts are invalid).
    if (isPublicHttpsUrl(backUrls.success)) {
      body.auto_return = "approved";
    }

    const notificationUrl = input.notificationUrl?.trim();
    if (notificationUrl && isPublicHttpsUrl(notificationUrl)) {
      body.notification_url = notificationUrl;
    }

    if (config.statementDescriptor) {
      body.statement_descriptor = config.statementDescriptor.slice(0, 22);
    }

    if (config.binaryMode) {
      body.binary_mode = true;
    }

    if (input.customer?.email) {
      body.payer = {
        email: input.customer.email,
        ...(input.customer.name ? { name: input.customer.name } : {}),
        ...(input.customer.phone
          ? { phone: { number: input.customer.phone } }
          : {}),
      };
    }

    // Keep currency consistent when all lines share one code.
    const currencies = new Set(items.map((item) => item.currency_id));
    if (currencies.size > 1) {
      throw new CheckoutError(
        "Cart contains multiple currencies; Mercado Pago preferences require a single currency.",
        { provider: "mercado-pago" },
      );
    }

    // Include time so retries after a failed payload are not sticky-cached.
    const idempotencyKey = `pref-${externalReference}-${Date.now()}`.slice(
      0,
      64,
    );

    const preference = await mercadoPagoFetch<PreferenceResponse>({
      method: "POST",
      path: "/checkout/preferences",
      body,
      idempotencyKey,
    });

    const redirectUrl = preference.init_point || preference.sandbox_init_point;

    if (!preference.id || !redirectUrl) {
      throw new CheckoutError(
        "Mercado Pago preference response missing id or checkout URL.",
        { provider: "mercado-pago", errors: preference },
      );
    }

    return {
      id: String(preference.id),
      provider: "mercado-pago",
      redirectUrl,
      status: "ready",
      expiresAt: preference.date_of_expiration ?? null,
      raw: preference,
    };
  }

  async getPayment(paymentId: string): Promise<CheckoutPayment | null> {
    if (!paymentId.trim()) return null;

    try {
      const payment = await mercadoPagoFetch<PaymentResponse>({
        method: "GET",
        path: `/v1/payments/${encodeURIComponent(paymentId)}`,
      });

      if (payment.id == null) return null;

      const amount =
        typeof payment.transaction_amount === "number" && payment.currency_id
          ? {
              amount: payment.transaction_amount.toFixed(2),
              currencyCode: payment.currency_id.toUpperCase(),
            }
          : null;

      return {
        id: String(payment.id),
        provider: "mercado-pago",
        status: mapPaymentStatus(payment.status),
        externalReference: payment.external_reference ?? null,
        amount,
        raw: payment,
      };
    } catch (error) {
      if (
        error instanceof CheckoutError &&
        (error.status === 404 || error.status === 400)
      ) {
        return null;
      }
      throw error;
    }
  }
}

export const mercadoPagoCheckoutProvider = new MercadoPagoCheckoutProvider();
