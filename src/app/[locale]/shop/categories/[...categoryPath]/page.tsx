import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { localizePath } from "@/config/navigation";
import { ShopPage, parseShopQuery } from "@/features/shop";
import { resolveCategoryPath } from "@/features/shop/category-hierarchy";
import { commerce } from "@/lib/commerce";
import { getSeoMetadata } from "@/lib/cms";

type Props = {
  params: Promise<{ locale: string; categoryPath: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function loadCategoryTrail(locale: string, categoryPath: string[]) {
  if (!commerce.isConfigured()) return [];
  const collections = await commerce.getCollections({ first: 100, locale });
  return resolveCategoryPath(collections.items, categoryPath);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, categoryPath } = await params;
  const trail = await loadCategoryTrail(locale, categoryPath);
  const category = trail?.at(-1);
  if (!trail || !category) return {};
  const canonicalPath = `/shop/categories/${trail.map((entry) => encodeURIComponent(entry.handle)).join("/")}`;

  return {
    ...(await getSeoMetadata(locale, {
      title: category.title,
      description: category.description,
      image: category.image?.url,
    })),
    alternates: {
      canonical: localizePath(locale, canonicalPath),
      languages: {
        es: localizePath("es", canonicalPath),
        en: localizePath("en", canonicalPath),
      },
    },
  };
}

export default async function CategoryShopRoutePage({
  params,
  searchParams,
}: Props) {
  const { locale, categoryPath } = await params;
  const raw = await searchParams;
  setRequestLocale(locale);

  const trail = await loadCategoryTrail(locale, categoryPath);
  if (commerce.isConfigured() && !trail) notFound();

  const [t, tProduct] = await Promise.all([
    getTranslations("shop"),
    getTranslations("product"),
  ]);

  return (
    <ShopPage
      locale={locale}
      query={parseShopQuery(raw, trail?.map((entry) => entry.handle) ?? [])}
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
