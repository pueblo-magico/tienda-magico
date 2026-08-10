import { CommerceError } from "@/types/commerce";
import { getShopifyConfig } from "./config";

type ShopifyGraphQLError = {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: Array<string | number>;
  extensions?: Record<string, unknown>;
};

type ShopifyResponse<T> = {
  data?: T;
  errors?: ShopifyGraphQLError[];
};

export async function shopifyFetch<T>({
  query,
  variables,
  cache = "force-cache",
  next,
  headers,
}: {
  query: string;
  variables?: Record<string, unknown>;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
  headers?: HeadersInit;
}): Promise<T> {
  const config = getShopifyConfig();

  let response: Response;

  try {
    response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Shopify-Storefront-Access-Token": config.storefrontAccessToken,
        ...headers,
      },
      body: JSON.stringify({ query, variables }),
      cache,
      next,
    });
  } catch (error) {
    throw new CommerceError("Failed to reach Shopify Storefront API.", {
      errors: error,
      provider: "shopify",
    });
  }

  let payload: ShopifyResponse<T>;

  try {
    payload = (await response.json()) as ShopifyResponse<T>;
  } catch {
    throw new CommerceError("Shopify Storefront API returned invalid JSON.", {
      status: response.status,
      provider: "shopify",
    });
  }

  if (!response.ok) {
    throw new CommerceError(
      `Shopify Storefront API request failed with status ${response.status}.`,
      {
        status: response.status,
        errors: payload.errors,
        provider: "shopify",
      },
    );
  }

  if (payload.errors?.length) {
    throw new CommerceError(
      payload.errors.map((error) => error.message).join(" | "),
      {
        status: response.status,
        errors: payload.errors,
        provider: "shopify",
      },
    );
  }

  if (!payload.data) {
    throw new CommerceError("Shopify Storefront API returned no data.", {
      status: response.status,
      provider: "shopify",
    });
  }

  return payload.data;
}
