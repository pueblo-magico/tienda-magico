import { NextResponse } from "next/server";
import { checkout } from "@/lib/checkout";

export const dynamic = "force-dynamic";

/**
 * Mercado Pago IPN / Webhooks endpoint.
 * https://www.mercadopago.com/developers/en/docs/your-integrations/notifications/webhooks
 *
 * Currently acknowledges and optionally loads payment details.
 * Extend later for order fulfillment / Payload order updates.
 */
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let paymentId: string | null = null;
    let topic: string | null = null;

    if (contentType.includes("application/json")) {
      const body = (await request.json()) as {
        type?: string;
        action?: string;
        data?: { id?: string | number };
        id?: string | number;
      };
      topic = body.type || body.action || null;
      if (body.data?.id != null) paymentId = String(body.data.id);
      else if (body.id != null) paymentId = String(body.id);
    } else {
      const text = await request.text();
      const params = new URLSearchParams(text);
      topic = params.get("topic") || params.get("type");
      paymentId = params.get("id") || params.get("data.id");
    }

    // Also accept query-string IPN style: ?topic=payment&id=123
    const url = new URL(request.url);
    topic = topic || url.searchParams.get("topic") || url.searchParams.get("type");
    paymentId =
      paymentId ||
      url.searchParams.get("data.id") ||
      url.searchParams.get("id");

    let payment = null;
    if (
      paymentId &&
      checkout.provider.name === "mercado-pago" &&
      checkout.provider.getPayment
    ) {
      payment = await checkout.getPayment(paymentId);
    }

    // Always 200 so MP does not retry aggressively during development.
    return NextResponse.json({
      received: true,
      topic,
      paymentId,
      paymentStatus: payment?.status ?? null,
      externalReference: payment?.externalReference ?? null,
    });
  } catch (error) {
    console.error("[mercado-pago webhook]", error);
    return NextResponse.json(
      {
        received: true,
        error: error instanceof Error ? error.message : "webhook error",
      },
      { status: 200 },
    );
  }
}

export async function GET(request: Request) {
  // Some MP test pings use GET
  const url = new URL(request.url);
  return NextResponse.json({
    ok: true,
    topic: url.searchParams.get("topic"),
    id: url.searchParams.get("id"),
  });
}
