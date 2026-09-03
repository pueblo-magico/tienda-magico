import { commerce } from "@/lib/commerce";
import type {
  CollectionSummary,
  Paginated,
  ProductSummary,
} from "@/types/commerce";
import { toCommerceProductsParams, type ShopQuery } from "./search-params";

export type ShopCatalogResult = {
  configured: boolean;
  products: Paginated<ProductSummary>;
  collections: CollectionSummary[];
  availableTags: string[];
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
      availableTags: [],
      error: null,
    };
  }

  try {
    const [products, collectionsPage] = await Promise.all([
      commerce.getProducts(toCommerceProductsParams(query, locale)),
      commerce.getCollections({ first: 24, locale }),
    ]);

    const minPrice = Number(query.minPrice);
    const maxPrice = Number(query.maxPrice);
    const selectedTags = new Set(query.tags.map((tag) => tag.toLowerCase()));
    const availableTags = Array.from(
      new Set(products.items.flatMap((product) => product.tags)),
    ).slice(0, 8);
    const filteredItems = products.items.filter((product) => {
      const price = Number(product.priceRange.minVariantPrice.amount);
      if (query.minPrice && Number.isFinite(minPrice) && price < minPrice)
        return false;
      if (query.maxPrice && Number.isFinite(maxPrice) && price > maxPrice)
        return false;
      if (
        selectedTags.size &&
        !product.tags.some((tag) => selectedTags.has(tag.toLowerCase()))
      )
        return false;
      return true;
    });

    return {
      configured: true,
      products: { ...products, items: filteredItems },
      collections: collectionsPage.items,
      availableTags,
      error: null,
    };
  } catch (error) {
    return {
      configured: true,
      products: emptyPage,
      collections: [],
      availableTags: [],
      error:
        error instanceof Error ? error.message : "Failed to load shop catalog.",
    };
  }
}
