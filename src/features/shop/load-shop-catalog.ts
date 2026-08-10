import { commerce } from "@/lib/commerce";
import type { CollectionSummary, Paginated, ProductSummary } from "@/types/commerce";
import { toCommerceProductsParams, type ShopQuery } from "./search-params";

export type ShopCatalogResult = {
  configured: boolean;
  products: Paginated<ProductSummary>;
  collections: CollectionSummary[];
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
  if (!commerce.isConfigured()) {
    return {
      configured: false,
      products: emptyPage,
      collections: [],
      error: null,
    };
  }

  try {
    const [products, collectionsPage] = await Promise.all([
      commerce.getProducts(toCommerceProductsParams(query, locale)),
      commerce.getCollections({ first: 24, locale }),
    ]);

    return {
      configured: true,
      products,
      collections: collectionsPage.items,
      error: null,
    };
  } catch (error) {
    return {
      configured: true,
      products: emptyPage,
      collections: [],
      error:
        error instanceof Error ? error.message : "Failed to load shop catalog.",
    };
  }
}
