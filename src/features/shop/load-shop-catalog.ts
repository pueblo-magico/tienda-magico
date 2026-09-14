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
      siteSettings: await siteSettingsPromise,
      error: null,
    };
  }

  try {
    const [products, collectionsPage, siteSettings] = await Promise.all([
      commerce.getProducts(toCommerceProductsParams(query, locale)),
      commerce.getCollections({ first: 24, locale }),
      siteSettingsPromise,
    ]);

    const minPrice = Number(query.minPrice);
    const maxPrice = Number(query.maxPrice);
    const selectedTags = new Set(query.tags);
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
      siteSettings: await siteSettingsPromise,
      error:
        error instanceof Error ? error.message : "Failed to load shop catalog.",
    };
  }
}
