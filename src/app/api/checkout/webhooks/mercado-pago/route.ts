import { receivePaymentNotification } from "@/lib/checkout";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const POST = receivePaymentNotification;

export function GET() {
  return Response.json({ ok: true });
}
