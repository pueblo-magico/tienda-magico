import type { CommerceProvider } from "./provider";
import { payloadEcommerceProvider } from "./providers/payload-ecommerce";
import { shopifyCommerceProvider } from "./providers/shopify";
import {
  CommerceConfigError,
  type CommerceProviderName,
} from "@/types/commerce";

const providers = {
  shopify: shopifyCommerceProvider,
  payload: payloadEcommerceProvider,
} as const satisfies Record<CommerceProviderName, CommerceProvider>;

const aliases: Record<string, CommerceProviderName> = {
  shopify: "shopify",
  payload: "payload",
  "payload-ecommerce": "payload",
  "payload_ecommerce": "payload",
  "payloadcms": "payload",
};

export function resolveCommerceProviderName(
  value = process.env.COMMERCE_PROVIDER,
): CommerceProviderName {
  const normalized = (value ?? "shopify").trim().toLowerCase();
  const resolved = aliases[normalized];

  if (resolved && resolved in providers) {
    return resolved;
  }

  throw new CommerceConfigError(
    `Unsupported COMMERCE_PROVIDER "${value}". Supported: shopify, payload (aliases: payload-ecommerce).`,
  );
}

export function createCommerceProvider(
  name?: CommerceProviderName,
): CommerceProvider {
  const providerName = name ?? resolveCommerceProviderName();
  return providers[providerName];
}
