import "server-only";
import { getCmsConfig } from "@/lib/cms/config";
import {
  isStaffCashOrder,
  staffCashErrorCode,
  type StaffCashAction,
} from "@/types/staff-cash";

export async function requestStaffCash(
  action: StaffCashAction,
  token?: string,
  input: Record<string, unknown> = {},
) {
  const config = getCmsConfig();
  if (!config) return { status: 503, body: { code: "unavailable" } };
  if (action !== "login" && !token)
    return { status: 401, body: { code: "unauthorized" } };
  const reference = input.reference;
  if (
    (action === "order" || action === "confirm") &&
    (typeof reference !== "string" ||
      !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(reference))
  )
    return { status: 400, body: { code: "invalid" } };
  const path =
    action === "order" || action === "confirm"
      ? `orders/${encodeURIComponent(String(reference))}${action === "confirm" ? "/confirm" : ""}`
      : action;
  const method = action === "session" || action === "order" ? "GET" : "POST";
  try {
    const url = new URL(
      `${config.apiPrefix}/storefront-staff/${path}`,
      `${config.baseUrl}/`,
    );
    const result = await fetch(url, {
      method,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10000),
      headers: {
        "Content-Type": "application/json",
        Origin: new URL(process.env.NEXT_PUBLIC_SITE_URL || config.baseUrl)
          .origin,
        ...(token ? { Authorization: `JWT ${token}` } : {}),
      },
      ...(method === "POST"
        ? {
            body: JSON.stringify(
              action === "login"
                ? { password: input.password }
                : action === "confirm"
                  ? { amount: input.amount, received: input.received }
                  : {},
            ),
          }
        : {}),
    });
    const body: unknown = await result.json();
    const value =
      body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    if (!result.ok)
      return {
        status:
          result.status >= 400 && result.status < 500 ? result.status : 503,
        body: {
          code: staffCashErrorCode(value.code),
        },
      };
    if (
      action === "login" &&
      typeof value.token === "string" &&
      typeof value.expiresIn === "number" &&
      value.expiresIn > 0 &&
      value.expiresIn <= 3600
    )
      return {
        status: 200,
        body: { authenticated: true },
        token: value.token,
        expiresIn: value.expiresIn,
      };
    if (action === "order" && isStaffCashOrder(value.order))
      return {
        status: 200,
        body: {
          order: {
            reference: value.order.reference,
            amount: value.order.amount,
            currency: value.order.currency,
            status: value.order.status,
            buyerName: value.order.buyerName,
          },
        },
      };
    if (action === "confirm" && value.confirmed === true)
      return { status: 200, body: { confirmed: true } };
    if (action === "session" && value.authenticated === true)
      return { status: 200, body: { authenticated: true } };
    if (action === "logout" && value.success === true)
      return { status: 200, body: { success: true } };
    return { status: 503, body: { code: "unavailable" } };
  } catch {
    return { status: 503, body: { code: "unavailable" } };
  }
}
