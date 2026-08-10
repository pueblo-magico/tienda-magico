import { CheckoutError } from "@/types/checkout";
import { getMercadoPagoConfig } from "./config";

type MpRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  body?: unknown;
  idempotencyKey?: string;
};

export async function mercadoPagoFetch<T>({
  method = "GET",
  path,
  body,
  idempotencyKey,
}: MpRequestOptions): Promise<T> {
  const config = getMercadoPagoConfig();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${config.apiBaseUrl}${normalizedPath}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${config.accessToken}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(idempotencyKey
          ? { "X-Idempotency-Key": idempotencyKey }
          : {}),
      },
      body: body == null ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch (error) {
    throw new CheckoutError("Failed to reach Mercado Pago API.", {
      provider: "mercado-pago",
      errors: error,
    });
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      throw new CheckoutError("Mercado Pago API returned invalid JSON.", {
        provider: "mercado-pago",
        status: response.status,
        errors: text,
      });
    }
  }

  if (!response.ok) {
    const message = extractErrorMessage(payload, response.status);
    throw new CheckoutError(message, {
      provider: "mercado-pago",
      status: response.status,
      errors: payload,
    });
  }

  return payload as T;
}

function extractErrorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === "object") {
    const root = payload as {
      message?: unknown;
      error?: unknown;
      cause?: Array<{ description?: unknown; code?: unknown }>;
    };

    if (typeof root.message === "string" && root.message.trim()) {
      const cause = root.cause?.[0];
      if (cause && typeof cause.description === "string") {
        return `${root.message}: ${cause.description}`;
      }
      return root.message;
    }

    if (typeof root.error === "string" && root.error.trim()) {
      return root.error;
    }
  }

  return `Mercado Pago API request failed with status ${status}.`;
}
