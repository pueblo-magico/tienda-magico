import type { CommerceImage } from "@/types/commerce";
import { cmsFetch } from "./client";
import { mediaAlt, resolveMediaUrl } from "./media";
import type { CmsMedia } from "./types";

export type SiteSettings = {
  shopHeroImage: CommerceImage | null;
};

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  shopHeroImage: null,
};

export async function getSiteSettings(locale: string): Promise<SiteSettings> {
  try {
    const settings = await cmsFetch<{
      shopHeroImage?: CmsMedia | string | number | null;
    }>({
      path: "/globals/site-settings",
      query: { depth: 1 },
      locale,
      next: { revalidate: 120, tags: ["site-settings"] },
    });
    const media = settings.shopHeroImage;
    const url = resolveMediaUrl(media);
    if (!url) return DEFAULT_SITE_SETTINGS;

    return {
      shopHeroImage: {
        url,
        altText: mediaAlt(media),
        width:
          media && typeof media === "object" ? (media.width ?? null) : null,
        height:
          media && typeof media === "object" ? (media.height ?? null) : null,
      },
    };
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}
