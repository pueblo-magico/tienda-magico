import { getCmsConfig } from "./config";
import type { CmsMedia } from "./types";

export function resolveMediaUrl(
  media: CmsMedia | string | number | null | undefined,
): string | null {
  if (media == null) return null;
  if (typeof media === "string") {
    if (media.startsWith("http://") || media.startsWith("https://") || media.startsWith("/")) {
      return absoluteCmsUrl(media);
    }
    return null;
  }
  if (typeof media === "number") return null;

  if (media.url) {
    return absoluteCmsUrl(media.url);
  }

  if (media.filename) {
    return absoluteCmsUrl(`/api/media/file/${media.filename}`);
  }

  return null;
}

export function absoluteCmsUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  const config = getCmsConfig();
  if (!config) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${config.baseUrl}${path}`;
}

export function mediaAlt(
  media: CmsMedia | string | number | null | undefined,
  fallback = "",
): string {
  if (media && typeof media === "object" && typeof media.alt === "string") {
    return media.alt;
  }
  return fallback;
}
