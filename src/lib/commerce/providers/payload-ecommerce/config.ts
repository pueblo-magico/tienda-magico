import { CommerceConfigError } from "@/types/commerce";

export type PayloadEcommerceConfig = {
  baseUrl: string;
  apiKey?: string;
  apiKeyCollection: string;
  apiPrefix: string;
  currencyCode: string;
  amountIsCents: boolean;
  productsSlug: string;
  variantsSlug: string;
  cartsSlug: string;
  collectionsSlug: string;
  checkoutBaseUrl: string;
  depth: number;
  defaultLocale: string;
  fallbackLocale: string;
};

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function readBool(name: string, fallback: boolean): boolean {
  const value = readEnv(name);
  if (value == null) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export function getPayloadEcommerceConfig(): PayloadEcommerceConfig {
  const baseUrl = readEnv("PAYLOAD_ECOMMERCE_URL")?.replace(/\/$/, "");
  if (!baseUrl) {
    throw new CommerceConfigError(
      "Missing PAYLOAD_ECOMMERCE_URL for self-hosted Payload Ecommerce.",
      "payload",
    );
  }

  const storefrontUrl =
    readEnv("NEXT_PUBLIC_SITE_URL")?.replace(/\/$/, "") ??
    readEnv("SITE_URL")?.replace(/\/$/, "") ??
    "http://localhost:3000";

  const checkoutPath =
    readEnv("PAYLOAD_ECOMMERCE_CHECKOUT_PATH") ?? "/checkout";
  if (
    (readEnv("PAYLOAD_ECOMMERCE_CURRENCY") ?? "ARS").toUpperCase() !== "ARS" ||
    !readBool("PAYLOAD_ECOMMERCE_AMOUNT_IS_CENTS", true)
  ) {
    throw new CommerceConfigError(
      "Payload requiere precios ARS en centavos.",
      "payload",
    );
  }

  return {
    baseUrl,
    apiKey: readEnv("PAYLOAD_ECOMMERCE_API_KEY"),
    apiKeyCollection:
      readEnv("PAYLOAD_ECOMMERCE_API_KEY_COLLECTION") ?? "users",
    apiPrefix: readEnv("PAYLOAD_ECOMMERCE_API_PREFIX") ?? "/api",
    currencyCode: (
      readEnv("PAYLOAD_ECOMMERCE_CURRENCY") ?? "ARS"
    ).toUpperCase(),
    amountIsCents: readBool("PAYLOAD_ECOMMERCE_AMOUNT_IS_CENTS", true),
    productsSlug: readEnv("PAYLOAD_ECOMMERCE_PRODUCTS_SLUG") ?? "products",
    variantsSlug: readEnv("PAYLOAD_ECOMMERCE_VARIANTS_SLUG") ?? "variants",
    cartsSlug: readEnv("PAYLOAD_ECOMMERCE_CARTS_SLUG") ?? "carts",
    collectionsSlug:
      readEnv("PAYLOAD_ECOMMERCE_COLLECTIONS_SLUG") ?? "categories",
    checkoutBaseUrl:
      readEnv("PAYLOAD_ECOMMERCE_CHECKOUT_URL")?.replace(/\/$/, "") ??
      `${storefrontUrl}${checkoutPath.startsWith("/") ? checkoutPath : `/${checkoutPath}`}`,
    depth: Number.parseInt(readEnv("PAYLOAD_ECOMMERCE_DEPTH") ?? "2", 10) || 2,
    defaultLocale: (
      readEnv("PAYLOAD_ECOMMERCE_DEFAULT_LOCALE") ?? "es"
    ).toLowerCase(),
    fallbackLocale: (
      readEnv("PAYLOAD_ECOMMERCE_FALLBACK_LOCALE") ?? "es"
    ).toLowerCase(),
  };
}

export function isPayloadEcommerceConfigured(): boolean {
  try {
    getPayloadEcommerceConfig();
    return true;
  } catch {
    return false;
  }
}
