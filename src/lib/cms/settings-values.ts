import type { CommerceImage } from "@/types/commerce";
import { getCmsConfig } from "./config";
import { cmsFetch } from "./client";

export function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function text(value: unknown): string | null {
  return typeof value === "string" ? value.trim() || null : null;
}

export function publicUrl(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function settingsImage(value: unknown): CommerceImage | null {
  const media = record(value);
  const raw = text(media.url) ?? (typeof value === "string" ? value : null);
  if (!raw || raw.startsWith("//") || raw.includes("\\")) return null;
  const config = getCmsConfig();
  const origin =
    publicUrl(process.env.CMS_MEDIA_ORIGIN) ??
    publicUrl(process.env.NEXT_PUBLIC_CMS_URL) ??
    publicUrl(config?.baseUrl);
  try {
    let url =
      raw.startsWith("/") && origin
        ? new URL(raw, origin).href
        : publicUrl(raw);
    if (!url) return null;
    if (
      origin &&
      config &&
      new URL(url).origin === new URL(config.baseUrl).origin
    ) {
      const source = new URL(url);
      url = new URL(`${source.pathname}${source.search}`, origin).href;
    }
    if (
      process.env.NODE_ENV === "production" &&
      /^(cms|localhost|127\.0\.0\.1|\[::1\])$/.test(new URL(url).hostname)
    )
      return null;
    return {
      url,
      altText: text(media.alt),
      width:
        typeof media.width === "number" && media.width > 0 ? media.width : null,
      height:
        typeof media.height === "number" && media.height > 0
          ? media.height
          : null,
    };
  } catch {
    return null;
  }
}

export async function settingsGlobal(
  slug: "site-settings" | "header" | "seo",
  locale: string,
) {
  if (!getCmsConfig()) return {};
  try {
    return record(
      await cmsFetch<unknown>({
        path: `/globals/${slug}`,
        locale,
        query: { depth: 1 },
        cache: "no-store",
      }),
    );
  } catch {
    console.warn(`[CMS] No se pudo leer ${slug}; se usan valores de respaldo.`);
    return {};
  }
}
