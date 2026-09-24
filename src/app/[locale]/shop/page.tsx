import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ShopPage, buildShopHref, parseShopQuery } from "@/features/shop";
import { resolveLegacyCategoryRoute } from "@/features/shop/category-hierarchy";
import { commerce } from "@/lib/commerce";
import { getSeoMetadata } from "@/lib/cms";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "shop" });
  return getSeoMetadata(locale, {
    title: t("title"),
    description: t("subtitle"),
  });
}

export default async function ShopRoutePage({ params, searchParams }: Props) {
  const { locale } = await params;
  const raw = await searchParams;
  setRequestLocale(locale);

  const [t, tProduct] = await Promise.all([
    getTranslations("shop"),
    getTranslations("product"),
  ]);
  const query = parseShopQuery(raw);

  if (query.collection && commerce.isConfigured()) {
    const collections = await commerce.getCollections({ first: 100, locale });
    const legacyRoute = resolveLegacyCategoryRoute(
      collections.items,
      query.collection,
      query.categories,
    );
    if (legacyRoute) {
      permanentRedirect(
        buildShopHref(locale, {
          ...query,
          collection: legacyRoute.categoryPath.at(-1) ?? "",
          categoryPath: legacyRoute.categoryPath,
          categories: legacyRoute.categories,
          after: "",
        }),
      );
    }
  }

  return (
    <ShopPage
      locale={locale}
      query={query}
      labels={{
        eyebrow: t("eyebrow"),
        title: t("title"),
        subtitle: t("subtitle"),
        notConfigured: t("notConfigured"),
        empty: t("empty"),
        emptyFiltered: t("emptyFiltered"),
        error: t("error"),
        search: t("search"),
        searchPlaceholder: t("searchPlaceholder"),
        sort: t("sort"),
        submit: t("submit"),
        clear: t("clear"),
        sortBest: t("sortBest"),
        sortNewest: t("sortNewest"),
        sortTitleAsc: t("sortTitleAsc"),
        sortTitleDesc: t("sortTitleDesc"),
        sortPriceAsc: t("sortPriceAsc"),
        sortPriceDesc: t("sortPriceDesc"),
        collections: t("collections"),
        allCollections: t("allCollections"),
        filters: t("filters"),
        price: t("price"),
        tags: t("tags"),
        minPrice: t("minPrice"),
        maxPrice: t("maxPrice"),
        origin: t("origin"),
        characteristics: t("characteristics"),
        availability: t("availability"),
        availableOnly: t("availableOnly"),
        clearAll: t("clearAll"),
        previous: t("previous"),
        next: t("next"),
        pagination: t("pagination"),
        subcategories: t("subcategories"),
        noMedia: tProduct("noMedia"),
      }}
    />
  );
}
