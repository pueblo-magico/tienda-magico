import type { CommerceImage } from "@/types/commerce";
import { cmsFetch } from "./client";
import { mediaAlt, resolveMediaUrl } from "./media";
import type { CmsMedia } from "./types";

export type SiteSettings = {
  shopHeroImage: CommerceImage | null;
  contactPhone: string | null;
};

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  shopHeroImage: null,
  contactPhone: null,
};

export async function getSiteSettings(locale: string): Promise<SiteSettings> {
  try {
    const settings = await cmsFetch<{
      shopHeroImage?: CmsMedia | string | number | null;
      contactPhone?: string | null;
    }>({
      path: "/globals/site-settings",
      query: { depth: 1 },
      locale,
      next: { revalidate: 120, tags: ["site-settings"] },
    });
    const media = settings.shopHeroImage;
    const url = resolveMediaUrl(media);

    return {
      shopHeroImage: url
        ? {
            url,
            altText: mediaAlt(media),
            width:
              media && typeof media === "object" ? (media.width ?? null) : null,
            height:
              media && typeof media === "object"
                ? (media.height ?? null)
                : null,
          }
        : null,
      contactPhone: settings.contactPhone?.trim() || null,
    };
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}
