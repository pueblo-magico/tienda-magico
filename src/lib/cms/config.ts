export type CmsConfig = {
  baseUrl: string;
  apiKey?: string;
  apiKeyCollection: string;
  apiPrefix: string;
  depth: number;
  defaultLocale: string;
  fallbackLocale: string;
  homePageSlug: string;
};

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

/**
 * Content CMS (Payload) config.
 * Reuses ecommerce URL/key when CMS-specific vars are unset.
 */
export function getCmsConfig(): CmsConfig | null {
  const baseUrl = (
    readEnv("PAYLOAD_CMS_URL") ??
    readEnv("PAYLOAD_ECOMMERCE_URL")
  )?.replace(/\/$/, "");

  if (!baseUrl) return null;

  return {
    baseUrl,
    apiKey:
      readEnv("PAYLOAD_CMS_API_KEY") ?? readEnv("PAYLOAD_ECOMMERCE_API_KEY"),
    apiKeyCollection:
      readEnv("PAYLOAD_CMS_API_KEY_COLLECTION") ??
      readEnv("PAYLOAD_ECOMMERCE_API_KEY_COLLECTION") ??
      "users",
    apiPrefix:
      readEnv("PAYLOAD_CMS_API_PREFIX") ??
      readEnv("PAYLOAD_ECOMMERCE_API_PREFIX") ??
      "/api",
    depth: Number.parseInt(readEnv("PAYLOAD_CMS_DEPTH") ?? "2", 10) || 2,
    defaultLocale: (
      readEnv("PAYLOAD_CMS_DEFAULT_LOCALE") ??
      readEnv("PAYLOAD_ECOMMERCE_DEFAULT_LOCALE") ??
      "en"
    ).toLowerCase(),
    fallbackLocale: (
      readEnv("PAYLOAD_CMS_FALLBACK_LOCALE") ??
      readEnv("PAYLOAD_ECOMMERCE_FALLBACK_LOCALE") ??
      "en"
    ).toLowerCase(),
    homePageSlug: readEnv("CMS_HOME_PAGE_SLUG") ?? "home",
  };
}

export function isCmsConfigured(): boolean {
  return getCmsConfig() != null;
}
