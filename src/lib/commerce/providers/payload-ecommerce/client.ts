import { CommerceError } from "@/types/commerce";
import {
  getPayloadEcommerceConfig,
  type PayloadEcommerceConfig,
} from "./config";

type PayloadRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
  headers?: HeadersInit;
};

function buildUrl(
  config: PayloadEcommerceConfig,
  path: string,
  query?: PayloadRequestOptions["query"],
) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const apiPath = `${config.apiPrefix}${normalizedPath}`.replace(/\/{2,}/g, "/");
  const url = new URL(apiPath, `${config.baseUrl}/`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value == null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

export async function payloadFetch<T>({
  method = "GET",
  path,
  query,
  body,
  cache = "no-store",
  next,
  headers,
}: PayloadRequestOptions): Promise<T> {
  const config = getPayloadEcommerceConfig();
  const url = buildUrl(config, path, query);

  let response: Response;

  try {
    response = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(config.apiKey
          ? {
              Authorization: `${config.apiKeyCollection} API-Key ${config.apiKey}`,
            }
          : {}),
        ...headers,
      },
      body: body == null ? undefined : JSON.stringify(body),
      cache,
      next,
    });
  } catch (error) {
    throw new CommerceError("Failed to reach Payload Ecommerce API.", {
      provider: "payload",
      errors: error,
    });
  }

  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      throw new CommerceError("Payload Ecommerce API returned invalid JSON.", {
        provider: "payload",
        status: response.status,
        errors: text,
      });
    }
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload &&
      "message" in payload &&
      typeof (payload as { message: unknown }).message === "string"
        ? (payload as { message: string }).message
        : `Payload Ecommerce API request failed with status ${response.status}.`;

    throw new CommerceError(message, {
      provider: "payload",
      status: response.status,
      errors: payload,
    });
  }

  return payload as T;
}

export function collectionPath(slug: string, id?: string | number) {
  return id == null ? `/${slug}` : `/${slug}/${id}`;
}

/** Payload REST localization query params. */
export function localeQuery(locale?: string | null): {
  locale: string;
  "fallback-locale": string;
} {
  const config = getPayloadEcommerceConfig();
  const normalized = (locale ?? config.defaultLocale).trim().toLowerCase() || config.defaultLocale;
  return {
    locale: normalized,
    "fallback-locale": config.fallbackLocale,
  };
}

