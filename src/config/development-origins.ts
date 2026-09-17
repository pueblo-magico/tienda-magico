export function developmentOrigins(
  url: string | undefined,
  environment: string | undefined,
): string[] {
  if (environment !== "development" || !url?.trim()) return [];
  const parsed = new URL(url.trim());
  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash ||
    !/^[a-z0-9.-]+$/i.test(parsed.hostname)
  ) {
    throw new Error(
      "DEV_STOREFRONT_URL debe ser un origen HTTPS sin credenciales, ruta ni comodines.",
    );
  }
  return [parsed.hostname];
}
