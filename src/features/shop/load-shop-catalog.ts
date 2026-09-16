import { commerce } from "@/lib/commerce";
import { getSiteSettings, type SiteSettings } from "@/lib/cms";
import type {
  CollectionSummary,
  Paginated,
  ProductSummary,
  TagReference,
} from "@/types/commerce";
import { toCommerceProductsParams, type ShopQuery } from "./search-params";

export type ShopCatalogResult = {
  configured: boolean;
  products: Paginated<ProductSummary>;
  collections: CollectionSummary[];
  selectedCollection: CollectionSummary | null;
  availableTags: TagReference[];
  availableOrigins: Array<{ value: string; label: string }>;
  priceBounds: { min: number; max: number };
  siteSettings: SiteSettings;
  error: string | null;
};

const emptyPage: Paginated<ProductSummary> = {
  items: [],
  pageInfo: {
    hasNextPage: false,
    hasPreviousPage: false,
    startCursor: null,
    endCursor: null,
  },
};

export async function loadShopCatalog(
  locale: string,
  query: ShopQuery,
): Promise<ShopCatalogResult> {
  const siteSettingsPromise = getSiteSettings(locale);
  if (!commerce.isConfigured()) {
    return {
      configured: false,
      products: emptyPage,
      collections: [],
      selectedCollection: null,
      availableTags: [],
      availableOrigins: [],
      priceBounds: { min: 0, max: 0 },
      siteSettings: await siteSettingsPromise,
      error: null,
    };
  }

  try {
    const [products, collectionsPage, siteSettings] = await Promise.all([
      commerce.getProducts(toCommerceProductsParams(query, locale)),
      commerce.getCollections({ first: 100, locale }),
      siteSettingsPromise,
    ]);

    const minPrice = Number(query.minPrice);
    const maxPrice = Number(query.maxPrice);
    const selectedTags = new Set(query.tags);
    const selectedOrigins = new Set(query.origins);
    const pricedAmounts = products.items
      .map((product) => Number(product.priceRange.minVariantPrice.amount))
      .filter(Number.isFinite);
    const priceBounds = {
      min: 0,
      max: pricedAmounts.length ? Math.ceil(Math.max(...pricedAmounts)) : 0,
    };
    const regionNames = new Intl.DisplayNames([locale], { type: "region" });
    const availableOrigins = Array.from(
      new Set(
        products.items
          .map((product) => product.origin?.countryCode)
          .filter((code): code is string => Boolean(code)),
      ),
    ).map((value) => ({
      value,
      label: regionNames.of(value) ?? value,
    }));
    const availableTags = Array.from(
      new Map(
        products.items
          .flatMap((product) => product.classification?.tags ?? [])
          .map((tag) => [tag.handle, tag]),
      ).values(),
    ).slice(0, 8);
    const filteredItems = products.items.filter((product) => {
      if (
        (query.minPrice || query.maxPrice) &&
        !product.priceRange.minVariantPrice.amount.trim()
      )
        return false;
      const price = Number(product.priceRange.minVariantPrice.amount);
      if (query.minPrice && Number.isFinite(minPrice) && price < minPrice)
        return false;
      if (query.maxPrice && Number.isFinite(maxPrice) && price > maxPrice)
        return false;
      if (
        selectedTags.size &&
        !(product.classification?.tags ?? []).some((tag) =>
          selectedTags.has(tag.handle),
        )
      )
        return false;
      if (
        selectedOrigins.size &&
        (!product.origin?.countryCode ||
          !selectedOrigins.has(product.origin.countryCode))
      )
        return false;
      if (query.availableOnly && !product.availableForSale) return false;
      return true;
    });

    return {
      configured: true,
      products: { ...products, items: filteredItems },
      collections: collectionsPage.items,
      selectedCollection:
        collectionsPage.items.find(
          (collection) => collection.handle === query.collection,
        ) ?? null,
      availableTags,
      availableOrigins,
      priceBounds,
      siteSettings,
      error: null,
    };
  } catch (error) {
    return {
      configured: true,
      products: emptyPage,
      collections: [],
      selectedCollection: null,
      availableTags: [],
      availableOrigins: [],
      priceBounds: { min: 0, max: 0 },
      siteSettings: await siteSettingsPromise,
      error:
        error instanceof Error ? error.message : "Failed to load shop catalog.",
    };
  }
}
