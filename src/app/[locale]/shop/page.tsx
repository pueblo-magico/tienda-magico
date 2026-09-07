import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ShopPage, parseShopQuery } from "@/features/shop";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "shop" });
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function ShopRoutePage({ params, searchParams }: Props) {
  const { locale } = await params;
  const raw = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations("shop");
  const query = parseShopQuery(raw);

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
        previous: t("previous"),
        next: t("next"),
        pagination: t("pagination"),
        subcategories: t("subcategories"),
      }}
    />
  );
}
