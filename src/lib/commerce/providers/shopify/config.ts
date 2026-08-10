import { CommerceConfigError } from "@/types/commerce";

export type ShopifyConfig = {
  domain: string;
  storefrontAccessToken: string;
  apiVersion: string;
  endpoint: string;
};

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function getShopifyConfig(): ShopifyConfig {
  const domain = readEnv("SHOPIFY_STORE_DOMAIN")
    ?.replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  const storefrontAccessToken = readEnv("SHOPIFY_STOREFRONT_ACCESS_TOKEN");
  const apiVersion = readEnv("SHOPIFY_API_VERSION") ?? "2025-01";

  if (!domain || !storefrontAccessToken) {
    throw new CommerceConfigError(
      "Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_STOREFRONT_ACCESS_TOKEN.",
      "shopify",
    );
  }

  return {
    domain,
    storefrontAccessToken,
    apiVersion,
    endpoint: `https://${domain}/api/${apiVersion}/graphql.json`,
  };
}

export function isShopifyConfigured(): boolean {
  try {
    getShopifyConfig();
    return true;
  } catch {
    return false;
  }
}
