import { NextResponse } from "next/server";
import { commerce } from "@/lib/commerce";
import {
  guestCartReferences,
  rememberGuestCart,
} from "@/lib/checkout/guest-orders";
import { parseGuestCartReferences } from "@/lib/commerce/guest-order-access";
import { parseOrderReceiptInput } from "@/lib/checkout/order-receipt";
import { orderCounts } from "@/lib/checkout/order-counts";

export async function GET() {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    const orders = await commerce.getGuestOrders(await guestCartReferences());
    return NextResponse.json(orderCounts(orders), { headers });
  } catch {
    return NextResponse.json(
      { error: "unavailable" },
      { status: 503, headers },
    );
  }
}

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object")
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    if ("cartReference" in body && typeof body.cartReference === "string") {
      const references = parseGuestCartReferences(
        JSON.stringify([body.cartReference]),
      );
      if (
        !references.length ||
        !(await commerce.getGuestOrders(references)).length
      ) {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
      }
      await rememberGuestCart(body.cartReference);
      return NextResponse.json({ ok: true });
    }
    if (
      "action" in body &&
      (body.action === "confirm-receipt" || body.action === "submit-feedback")
    ) {
      const receipt = parseOrderReceiptInput({
        ...body,
        action: "confirm-receipt",
        ...(!("rating" in body) && body.action === "confirm-receipt"
          ? { rating: 0 }
          : {}),
      });
      if (!receipt) {
        return NextResponse.json({ error: "invalid" }, { status: 400 });
      }
      const saved =
        body.action === "submit-feedback"
          ? await commerce.submitGuestOrderFeedback(
              await guestCartReferences(),
              receipt.reference,
              receipt,
            )
          : await commerce.confirmGuestOrderReceipt(
              await guestCartReferences(),
              receipt.reference,
              "rating" in body ? receipt : undefined,
            );
      return NextResponse.json({ ok: saved }, { status: saved ? 200 : 404 });
    }
    if (
      "action" in body &&
      body.action === "cancel-cash" &&
      "reference" in body &&
      typeof body.reference === "string"
    ) {
      const saved = await commerce.cancelGuestCashOrder(
        await guestCartReferences(),
        body.reference,
      );
      return NextResponse.json({ ok: saved }, { status: saved ? 200 : 404 });
    }
    if ("reference" in body && typeof body.reference === "string") {
      const saved = await commerce.reportGuestTransfer(
        await guestCartReferences(),
        body.reference,
      );
      return NextResponse.json({ ok: saved }, { status: saved ? 200 : 404 });
    }
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
