import type { CommerceProvider } from "./provider";
import { shopifyCommerceProvider } from "./providers/shopify";
import {
  CommerceConfigError,
  type CommerceProviderName,
} from "@/types/commerce";

const providers = {
  shopify: shopifyCommerceProvider,
} as const satisfies Record<CommerceProviderName, CommerceProvider>;

export function resolveCommerceProviderName(
  value = process.env.COMMERCE_PROVIDER,
): CommerceProviderName {
  const normalized = (value ?? "shopify").trim().toLowerCase();

  if (normalized in providers) {
    return normalized as CommerceProviderName;
  }

  throw new CommerceConfigError(
    `Unsupported COMMERCE_PROVIDER "${value}". Supported: ${Object.keys(providers).join(", ")}.`,
  );
}

export function createCommerceProvider(
  name?: CommerceProviderName,
): CommerceProvider {
  const providerName = name ?? resolveCommerceProviderName();
  return providers[providerName];
}
