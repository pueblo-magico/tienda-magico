import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { PaymentNotification } from "@/types/payment-notification";
import { getMercadoPagoConfig } from "./config";
import { normalizeTransferIdentification } from "../../transfer-identification";

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

    const {
      status: paymentStatus,
      transaction_amount: transactionAmount,
      currency_id: currency,
      live_mode: liveMode,
      date_last_updated: providerUpdatedAt,
    } = payment;

    const matchesRequestedPayment = identifier(payment.id) === resourceId;
    const belongsToMerchant =
      collectorId !== null && collectorId === identifier(account.id);
    if (!matchesRequestedPayment || !belongsToMerchant) return fail(502);

    const matchesEnvironment = liveMode === !config.sandbox;
    if (!matchesEnvironment) return fail(502);

    const hasValidStatus =
      typeof paymentStatus === "string" && /^[a-z_]{1,50}$/.test(paymentStatus);
    if (!hasValidStatus) return fail(502);

    const hasValidAmount =
      typeof transactionAmount === "number" &&
      Number.isFinite(transactionAmount) &&
      transactionAmount >= 0 &&
      /^\d+(\.\d{1,2})?$/.test(String(transactionAmount));
    const hasSupportedCurrency = currency === "ARS";
    if (!hasValidAmount || !hasSupportedCurrency) return fail(502);

    const hasValidUpdateTime =
      typeof providerUpdatedAt === "string" &&
      Number.isFinite(Date.parse(providerUpdatedAt));
    if (!hasValidUpdateTime) return fail(502);

    const amount = Math.round(transactionAmount * 100);
    if (!Number.isSafeInteger(amount)) return fail(502);
    const publicReference =
      typeof payment.external_reference === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        payment.external_reference,
      )
        ? payment.external_reference.toLowerCase()
        : null;
    const identification = normalizeTransferIdentification(
      object(payment.payer).identification,
    );
    const descriptionReference =
      typeof payment.description === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        payment.description.trim(),
      )
        ? payment.description.trim().toLowerCase()
        : null;
    const refund = payment.transaction_amount_refunded;
    const refundedAmount =
      typeof refund === "number" &&
      refund >= 0 &&
      /^\d+(\.\d{1,2})?$/.test(String(refund)) &&
      Number.isSafeInteger(Math.round(refund * 100))
        ? Math.round(refund * 100)
        : null;
    const notification = {
      resourceId,
      paymentStatus,
      amount,
      currency,
      publicReference: publicReference ?? descriptionReference,
      payerType: identification?.type ?? null,
      payerNumber: identification?.number ?? null,
      paymentType:
        typeof payment.payment_type_id === "string" &&
        /^[a-z_]{1,50}$/.test(payment.payment_type_id)
          ? payment.payment_type_id
          : null,
      statusDetail:
        !(
          publicReference &&
          descriptionReference &&
          publicReference !== descriptionReference
        ) &&
        typeof payment.status_detail === "string" &&
        /^[a-z_]{1,50}$/.test(payment.status_detail)
          ? payment.status_detail
          : null,
      refundedAmount,
      approvedAt:
        typeof payment.date_approved === "string" &&
        Number.isFinite(Date.parse(payment.date_approved))
          ? new Date(payment.date_approved).toISOString()
          : null,
      liveMode,
      providerUpdatedAt: new Date(providerUpdatedAt).toISOString(),
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
