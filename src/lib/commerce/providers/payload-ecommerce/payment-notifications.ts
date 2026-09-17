import type { PaymentNotification } from "@/types/payment-notification";
import { getPayloadEcommerceConfig } from "./config";

export async function recordPaymentNotification(
  notification: PaymentNotification,
): Promise<void> {
  const matches = (saved: unknown) =>
    saved !== null &&
    typeof saved === "object" &&
    Object.entries(notification).every(
      ([key, value]) => (saved as Record<string, unknown>)[key] === value,
    );
  const config = getPayloadEcommerceConfig();
  if (!config.apiKey) throw new Error("Falta la credencial del CMS.");
  const url = new URL(
    `${config.apiPrefix}/payment-notifications`,
    `${config.baseUrl}/`,
  );
  const headers = {
    Authorization: `${config.apiKeyCollection} API-Key ${config.apiKey}`,
    "Content-Type": "application/json",
  };
  const reconcile = async () => {
    const response = await fetch(
      new URL(
        `${config.apiPrefix}/payment-notifications/reconcile`,
        `${config.baseUrl}/`,
      ),
      {
        method: "POST",
        headers,
        body: JSON.stringify({ idempotencyKey: notification.idempotencyKey }),
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!response.ok || (await response.json()).reconciled !== true)
      throw new Error("No se pudo conciliar la notificación de pago.");
  };
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(notification),
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(5000),
  });
  if (response.ok) {
    const result: unknown = await response.json();
    if (
      result &&
      typeof result === "object" &&
      "doc" in result &&
      matches(result.doc)
    )
      return reconcile();
    throw new Error("El CMS no confirmó la persistencia de la notificación.");
  }
  url.searchParams.set(
    "where[idempotencyKey][equals]",
    notification.idempotencyKey,
  );
  url.searchParams.set("limit", "1");
  url.searchParams.set("depth", "0");
  const existing = await fetch(url, {
    headers,
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(5000),
  });
  if (existing.ok) {
    const result: unknown = await existing.json();
    if (
      result &&
      typeof result === "object" &&
      "docs" in result &&
      Array.isArray(result.docs)
    ) {
      const saved: unknown = result.docs[0];
      if (matches(saved)) return reconcile();
    }
  }
  throw new Error("No se pudo guardar la notificación de pago.");
}
