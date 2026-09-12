import { NextResponse } from "next/server";
import { commerce } from "@/lib/commerce";
import { checkout } from "@/lib/checkout";
import { CheckoutConfigError, CheckoutError } from "@/types/checkout";
import {
  FulfillmentModeError,
  validateFulfillmentModeForCheckout,
} from "@/lib/commerce/local-purchase";

export const dynamic = "force-dynamic";

function siteUrl(request: Request): string {
  const env =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim();
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

    if (!checkout.isConfigured()) {
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

    const fulfillmentMode = validateFulfillmentModeForCheckout(
      cart.fulfillmentMode,
    );

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

    const session = await checkout.createCheckoutSession({
      cart,
      locale,
      customer: {
        email: body.email?.trim() || null,
        name: body.name?.trim() || null,
      },
      returnUrls,
      externalReference: cart.id,
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
