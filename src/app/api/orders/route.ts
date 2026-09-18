import { NextResponse } from "next/server";
import { commerce } from "@/lib/commerce";
import {
  guestCartReferences,
  rememberGuestCart,
} from "@/lib/checkout/guest-orders";
import { parseGuestCartReferences } from "@/lib/commerce/guest-order-access";

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
