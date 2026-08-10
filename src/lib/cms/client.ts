import { getCmsConfig, type CmsConfig } from "./config";

type CmsRequestOptions = {
  method?: "GET" | "POST";
  path: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
  locale?: string;
};

export class CmsError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, options?: { status?: number; details?: unknown }) {
    super(message);
    this.name = "CmsError";
    this.status = options?.status;
    this.details = options?.details;
  }
}

function buildUrl(
  config: CmsConfig,
  path: string,
  query?: CmsRequestOptions["query"],
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

export async function cmsFetch<T>({
  method = "GET",
  path,
  query,
  cache = "no-store",
  next,
  locale,
}: CmsRequestOptions): Promise<T> {
  const config = getCmsConfig();
  if (!config) {
    throw new CmsError("CMS is not configured (set PAYLOAD_CMS_URL or PAYLOAD_ECOMMERCE_URL).");
  }

  const mergedQuery = {
    ...query,
    locale: locale ?? query?.locale ?? config.defaultLocale,
    "fallback-locale": config.fallbackLocale,
  };

  const url = buildUrl(config, path, mergedQuery);

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        ...(config.apiKey
          ? {
              Authorization: `${config.apiKeyCollection} API-Key ${config.apiKey}`,
            }
          : {}),
      },
      // Prefer Next.js revalidate tags when provided; otherwise no-store.
      ...(next ? { next } : { cache: cache ?? "no-store" }),
    });
  } catch (error) {
    throw new CmsError("Failed to reach Payload CMS API.", { details: error });
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      throw new CmsError("Payload CMS returned invalid JSON.", {
        status: response.status,
        details: text,
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
        : `CMS request failed (${response.status}).`;
    throw new CmsError(message, { status: response.status, details: payload });
  }

  return payload as T;
}
