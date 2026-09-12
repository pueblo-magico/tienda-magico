import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { loadProductPage, ProductPageView } from "@/features/product";
import { commerce } from "@/lib/commerce";

type Props = {
  params: Promise<{ locale: string; handle: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, handle } = await params;

  if (!commerce.isConfigured()) {
    return { title: handle };
  }

  try {
    const product = await commerce.getProduct(handle, { locale });
    if (!product) return { title: handle };

    const title = product.seo.title || product.title;
    const description =
      product.seo.description ||
      product.description?.slice(0, 160) ||
      undefined;
    const image = product.seo.image?.url ?? product.featuredImage?.url;

    return {
      title,
      description,
      robots: product.seo.noIndex ? { index: false, follow: false } : undefined,
      openGraph: {
        title,
        description,
        images: image ? [{ url: image }] : undefined,
      },
    };
  } catch {
    return { title: handle };
  }
}

export default async function ProductRoutePage({ params }: Props) {
  const { locale, handle } = await params;
  setRequestLocale(locale);

  const data = await loadProductPage(handle, locale);
  if (!data) notFound();

  const t = await getTranslations("product");

  return (
    <ProductPageView
      locale={locale}
      product={data.product}
      related={data.related}
      labels={{
        backToShop: t("backToShop"),
        gallery: t("gallery"),
        noMedia: t("noMedia"),
        mediaError: t("mediaError"),
        retryMedia: t("retryMedia"),
        addToCart: t("addToCart"),
        adding: t("adding"),
        soldOut: t("soldOut"),
        quantity: t("quantity"),
        decrease: t("decrease"),
        increase: t("increase"),
        from: t("from"),
        unavailable: t("unavailable"),
        productUnavailable: t("productUnavailable"),
        addFailed: t("addFailed"),
        storyEyebrow: t("storyEyebrow"),
        storyTitle: t("storyTitle"),
        impactEyebrow: t("impactEyebrow"),
        impactTitle: t("impactTitle"),
        relatedEyebrow: t("relatedEyebrow"),
        relatedTitle: t("relatedTitle"),
        tags: t("tags"),
        breadcrumb: t("breadcrumb"),
        description: t("description"),
        ingredients: t("ingredients"),
        howToUse: t("howToUse"),
        originImpact: t("originImpact"),
        originCountry: t("originCountry"),
        originRegion: t("originRegion"),
        originCommunity: t("originCommunity"),
        freeShipping: t("freeShipping"),
        securePayment: t("securePayment"),
        ethicallySourced: t("ethicallySourced"),
      }}
    />
  );
}
