import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getSiteSettings } from "./site-settings";
import {
  publicUrl,
  record,
  settingsGlobal,
  settingsImage,
  text,
} from "./settings-values";

type PageSeo = {
  title?: string | null;
  description?: string | null;
  image?: string | null;
  noIndex?: boolean;
};

export function composeSeoMetadata(
  settings: { siteName: string },
  raw: unknown,
  fallbackDescription: string,
  page?: PageSeo,
): Metadata {
  const seo = record(raw);
  const defaultTitle = text(seo.defaultTitle) ?? settings.siteName;
  const title = text(page?.title) ?? defaultTitle;
  const description =
    text(page?.description) ??
    text(seo.defaultDescription) ??
    fallbackDescription;
  const template = text(seo.titleTemplate);
  const image =
    settingsImage(page?.image)?.url ?? settingsImage(seo.defaultOgImage)?.url;
  const robots = record(seo.robots);
  const handle = text(seo.twitterHandle)?.replace(/^@/, "");
  const metadataBase = publicUrl(process.env.NEXT_PUBLIC_SITE_URL);
  return {
    ...(metadataBase ? { metadataBase: new URL(metadataBase) } : {}),
    title: page
      ? title
      : {
          default: defaultTitle,
          template: template?.includes("%s")
            ? template
            : `%s · ${settings.siteName}`,
        },
    description,
    robots: {
      index: page?.noIndex ? false : robots.index !== false,
      follow: page?.noIndex ? false : robots.follow !== false,
    },
    openGraph: {
      title,
      description,
      siteName: settings.siteName,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
      ...(handle && /^[A-Za-z0-9_]{1,15}$/.test(handle)
        ? { site: `@${handle}` }
        : {}),
    },
  };
}

export async function getSeoMetadata(
  locale: string,
  page?: PageSeo,
): Promise<Metadata> {
  const [settings, seo, t] = await Promise.all([
    getSiteSettings(locale),
    settingsGlobal("seo", locale),
    getTranslations({ locale, namespace: "footer" }),
  ]);
  return composeSeoMetadata(settings, seo, t("tagline"), page);
}
