import { NextResponse } from "next/server";
import { commerce } from "@/lib/commerce";
import { checkout } from "@/lib/checkout";
import { CheckoutConfigError, CheckoutError } from "@/types/checkout";
import { CommerceConfigError, CommerceError } from "@/types/commerce";
import {
  FulfillmentModeError,
  validateFulfillmentModeForCheckout,
} from "@/lib/commerce/local-purchase";
import { getCommerceSettings } from "@/lib/cms";
import { isFulfillmentModeEnabled } from "@/lib/commerce/commerce-settings";
import {
  PaymentMethodError,
  parsePaymentMethod,
} from "@/lib/checkout/payment-method";
import { BANK_TRANSFER, MERCADO_PAGO } from "@/types/checkout";
import {
  bankTransferExpiry,
  createBankTransferSession,
} from "@/lib/checkout/bank-transfer";
import {
  CheckoutCustomerError,
  validateCheckoutCustomer,
} from "@/lib/checkout/customer";

export const dynamic = "force-dynamic";

function siteUrl(request: Request): string {
  const env =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim();
  if (env) return env.replace(/\/$/, "");

  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "localhost:3000";
  const proto =
    request.headers.get("x-forwarded-proto") ||
    (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`.replace(/\/$/, "");
}

function errorResponse(error: unknown) {
  if (error instanceof FulfillmentModeError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof PaymentMethodError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof CheckoutCustomerError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof CheckoutConfigError) {
    return NextResponse.json(
      {
        error: error.message,
        provider: error.provider ?? null,
        configured: false,
      },
      { status: 503 },
    );
  }

  if (error instanceof CommerceConfigError) {
    return NextResponse.json(
      {
        error: error.message,
        provider: error.provider ?? null,
        configured: false,
      },
      { status: 503 },
    );
  }

  if (error instanceof CommerceError) {
    return NextResponse.json(
      {
        error: error.message,
        provider: error.provider ?? null,
      },
      { status: error.status && error.status >= 400 ? error.status : 502 },
    );
  }

  if (error instanceof CheckoutError) {
    return NextResponse.json(
      {
        error: error.message,
        provider: error.provider ?? null,
        details: error.errors ?? null,
      },
      { status: error.status && error.status >= 400 ? error.status : 502 },
    );
  }

  return NextResponse.json(
    {
      error: error instanceof Error ? error.message : "Checkout failed.",
    },
    { status: 500 },
  );
}

type CheckoutBody = {
  cartId?: string;
  locale?: string;
  email?: string;
  name?: string;
  paymentMethod?: string;
};

/**
 * POST /api/checkout
 * Creates a provider checkout session from the current commerce cart.
 */
export async function POST(request: Request) {
  try {
    if (!commerce.isConfigured()) {
      return NextResponse.json(
        {
          error: "Commerce provider is not configured.",
          configured: false,
        },
        { status: 503 },
      );
    }

    const body = (await request.json()) as CheckoutBody;
    const cartId = body.cartId?.trim();
    const locale = (body.locale?.trim() || "en").toLowerCase();

    if (!cartId) {
      return NextResponse.json(
        { error: "cartId is required." },
        { status: 400 },
      );
    }

    const cart = await commerce.getCart(cartId, { locale });
    if (!cart || !cart.lines.length) {
      return NextResponse.json(
        { error: "Cart not found or empty." },
        { status: 404 },
      );
    }

    if (
      cart.lines.some(
        (line) =>
          line.issue ||
          (line.maxPurchaseQuantity != null &&
            line.quantity > line.maxPurchaseQuantity),
      )
    ) {
      throw new CommerceError(
        locale.startsWith("es")
          ? "Revisá los precios y la disponibilidad de los productos en tu carrito antes de pagar."
          : "Review product prices and availability in your cart before paying.",
        { status: 409 },
      );
    }

    const fulfillmentMode = validateFulfillmentModeForCheckout(
      cart.fulfillmentMode,
      locale,
    );
    const commerceSettings = await getCommerceSettings();
    if (!isFulfillmentModeEnabled(fulfillmentMode, commerceSettings)) {
      throw new FulfillmentModeError(locale);
    }
    const paymentMethod = parsePaymentMethod(
      body.paymentMethod,
      commerceSettings,
      locale,
    );

    if (paymentMethod === MERCADO_PAGO && !checkout.isConfigured()) {
      return NextResponse.json(
        {
          error:
            "Checkout provider is not configured. Set CHECKOUT_PROVIDER and provider credentials.",
          configured: false,
          provider: checkout.provider.name,
        },
        { status: 503 },
      );
    }

    const base = siteUrl(request);
    const returnUrls = {
      success: `${base}/${locale}/checkout/success`,
      failure: `${base}/${locale}/checkout/failure`,
      pending: `${base}/${locale}/checkout/pending`,
    };

    const notificationUrl =
      process.env.MERCADOPAGO_WEBHOOK_URL?.trim() ||
      process.env.CHECKOUT_WEBHOOK_URL?.trim() ||
      `${base}/api/checkout/webhooks/mercado-pago`;

    const customer = validateCheckoutCustomer(
      {
        email: body.email?.trim() || null,
        name: body.name?.trim() || null,
      },
      locale,
    );
    const paymentExpiresAt =
      paymentMethod === BANK_TRANSFER
        ? bankTransferExpiry(commerceSettings.transfer.paymentWindowMinutes)
        : null;
    const order = await commerce.createCheckoutOrder(cart, customer, {
      paymentMethod,
      paymentExpiresAt,
    });
    if (paymentMethod === BANK_TRANSFER) {
      if (!order) {
        throw new CommerceError(
          locale.startsWith("es")
            ? "No se pudo crear el pedido pendiente."
            : "Could not create the pending order.",
          {
            status: 502,
          },
        );
      }
      const session = createBankTransferSession({
        baseUrl: base,
        locale,
        orderId: order.publicReference,
        paymentWindowMinutes: commerceSettings.transfer.paymentWindowMinutes,
        expiresAt: order.paymentExpiresAt ?? paymentExpiresAt ?? undefined,
      });
      return NextResponse.json({ session, configured: true });
    }
    const session = await checkout.createCheckoutSession({
      cart,
      locale,
      customer,
      returnUrls,
      externalReference: order?.id ?? cart.id,
      notificationUrl:
        checkout.provider.name === "mercado-pago" ? notificationUrl : null,
      metadata: {
        locale,
        fulfillment_mode: fulfillmentMode,
      },
    });

    return NextResponse.json({
      session: {
        id: session.id,
        provider: session.provider,
        redirectUrl: session.redirectUrl,
        status: session.status,
        expiresAt: session.expiresAt ?? null,
      },
      configured: true,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

/** GET /api/checkout — provider status */
export async function GET() {
  return NextResponse.json({
    provider: checkout.provider.name,
    configured: checkout.isConfigured(),
    commerceConfigured: commerce.isConfigured(),
  });
}
