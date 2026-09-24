import type { CommerceImage } from "@/types/commerce";
import { defaultBrand } from "@/config/brand";
import {
  publicUrl,
  record,
  settingsGlobal,
  settingsImage,
  text,
} from "./settings-values";

export type SiteSettings = {
  siteName: string;
  tagline: string | null;
  logo: CommerceImage | null;
  shopHeroImage: CommerceImage | null;
  contactPhone: string | null;
  contactEmail: string | null;
  social: Array<{ url: string; label: string }>;
};

export async function getSiteSettings(locale: string): Promise<SiteSettings> {
  const settings = await settingsGlobal("site-settings", locale);
  const email = text(settings.contactEmail);
  return {
    siteName: text(settings.siteName) ?? defaultBrand.name,
    tagline: text(settings.tagline),
    logo: settingsImage(settings.logo),
    shopHeroImage: settingsImage(settings.shopHeroImage),
    contactPhone: text(settings.contactPhone),
    contactEmail:
      email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null,
    social: (Array.isArray(settings.social) ? settings.social : []).flatMap(
      (entry) => {
        const link = record(entry);
        const url = publicUrl(link.url);
        return url
          ? [
              {
                url,
                label:
                  text(link.label) ??
                  text(link.platform) ??
                  new URL(url).hostname,
              },
            ]
          : [];
      },
    ),
  };
}

export async function getHeaderLogo(locale: string, settings: SiteSettings) {
  const header = await settingsGlobal("header", locale);
  return settingsImage(header.logo) ?? settings.logo;
}
