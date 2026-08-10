import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { FallbackHome, RenderBlocks } from "@/features/cms";
import { getHomePage, isCmsConfigured, resolveMediaUrl } from "@/lib/cms";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  try {
    const page = await getHomePage(locale);
    if (!page) return {};

    const title = page.seo?.title || page.title;
    const description = page.seo?.description || undefined;
    const image = resolveMediaUrl(page.seo?.image);

    return {
      title,
      description,
      robots: page.seo?.noIndex ? { index: false, follow: false } : undefined,
      openGraph: {
        title: title || undefined,
        description,
        images: image ? [{ url: image }] : undefined,
      },
    };
  } catch {
    return {};
  }
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (isCmsConfigured()) {
    try {
      const page = await getHomePage(locale);
      if (page?.layout?.length) {
        return <RenderBlocks blocks={page.layout} locale={locale} />;
      }
    } catch {
      // fall through to static home
    }
  }

  return <FallbackHome locale={locale} />;
}
