import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { PaymentNotification } from "@/types/payment-notification";
import { getMercadoPagoConfig } from "./config";

type Dependencies = {
  config: { secret?: string; accessToken?: string; sandbox: boolean };
  fetch: typeof fetch;
  record: (notification: PaymentNotification) => Promise<void>;
};

export function receiveMercadoPagoNotification(
  request: Request,
  record: Dependencies["record"],
): Promise<Response> {
  try {
    const config = getMercadoPagoConfig();
    return receiveMercadoPagoWebhook(request, {
      config: {
        ...config,
        secret: process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim(),
      },
      fetch,
      record,
    });
  } catch {
    return Promise.resolve(Response.json({ received: false }, { status: 503 }));
  }
}

function object(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function identifier(value: unknown): string | null {
  if (typeof value === "number" && !Number.isSafeInteger(value)) return null;
  return (typeof value === "string" || typeof value === "number") &&
    /^[1-9]\d{0,19}$/.test(String(value))
    ? String(value)
    : null;
}

async function boundedBody(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("body");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 16384) throw new Error("body");
      chunks.push(chunk.value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
}

export async function receiveMercadoPagoWebhook(
  request: Request,
  dependencies: Dependencies,
): Promise<Response> {
  const { config } = dependencies;
  const fail = (status: number) =>
    Response.json({ received: false }, { status });
  if (!config.secret?.trim() || !config.accessToken?.trim()) return fail(503);
  const url = new URL(request.url);
  const resourceId = identifier(url.searchParams.get("data.id"));
  const requestId = request.headers.get("x-request-id");
  const parts = (request.headers.get("x-signature") ?? "")
    .split(",")
    .map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith("ts="))?.slice(3);
  const digest = parts.find((part) => part.startsWith("v1="))?.slice(3);
  if (
    !resourceId ||
    url.searchParams.getAll("data.id").length !== 1 ||
    !requestId ||
    !/^[a-zA-Z0-9_-]{1,200}$/.test(requestId) ||
    parts.length !== 2 ||
    !timestamp ||
    !/^\d{10,13}$/.test(timestamp) ||
    !digest ||
    !/^[a-fA-F0-9]{64}$/.test(digest)
  )
    return fail(401);
  const expected = createHmac("sha256", config.secret)
    .update(`id:${resourceId};request-id:${requestId};ts:${timestamp};`)
    .digest();
  if (!timingSafeEqual(expected, Buffer.from(digest, "hex"))) return fail(401);
  let body: Record<string, unknown>;
  try {
    body = object(await boundedBody(request));
  } catch {
    return fail(400);
  }
  if (identifier(object(body.data).id) !== resourceId) return fail(400);
  if (
    body.type !== "payment" ||
    (url.searchParams.has("type") && url.searchParams.get("type") !== "payment")
  )
    return fail(422);
  try {
    const load = async (path: string) => {
      const response = await dependencies.fetch(
        `https://api.mercadopago.com${path}`,
        {
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
            Accept: "application/json",
          },
          cache: "no-store",
          redirect: "error",
          signal: AbortSignal.timeout(5000),
        },
      );
      if (!response.ok) throw new Error("provider");
      return object(await response.json());
    };
    const [payment, account] = await Promise.all([
      load(`/v1/payments/${resourceId}`),
      load("/users/me"),
    ]);
    const collectorId = identifier(payment.collector_id);
    if (
      identifier(payment.id) !== resourceId ||
      !collectorId ||
      collectorId !== identifier(account.id) ||
      payment.live_mode !== !config.sandbox ||
      typeof payment.status !== "string" ||
      !/^[a-z_]{1,50}$/.test(payment.status) ||
      typeof payment.transaction_amount !== "number" ||
      !Number.isFinite(payment.transaction_amount) ||
      payment.transaction_amount < 0 ||
      !/^\d+(\.\d{1,2})?$/.test(String(payment.transaction_amount)) ||
      payment.currency_id !== "ARS" ||
      typeof payment.date_last_updated !== "string" ||
      !Number.isFinite(Date.parse(payment.date_last_updated))
    )
      return fail(502);
    const amount = Math.round(payment.transaction_amount * 100);
    if (!Number.isSafeInteger(amount)) return fail(502);
    const publicReference =
      typeof payment.external_reference === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        payment.external_reference,
      )
        ? payment.external_reference.toLowerCase()
        : null;
    const notification = {
      resourceId,
      paymentStatus: payment.status,
      amount,
      currency: payment.currency_id,
      publicReference,
      liveMode: payment.live_mode,
      providerUpdatedAt: new Date(payment.date_last_updated).toISOString(),
    };
    await dependencies.record({
      ...notification,
      idempotencyKey: createHash("sha256")
        .update(JSON.stringify(notification))
        .digest("hex"),
    });
    return Response.json({ received: true });
  } catch {
    return fail(503);
  }
}
