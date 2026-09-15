import type {
  GetProductsParams,
  Paginated,
  Product,
  ProductSummary,
} from "@/types/commerce";
import { shopifyFetch } from "./client";
import { productFragment, productSummaryFragment } from "./fragments";
import { mapProduct, mapProductSummary } from "./mappers";

const getProductsQuery = /* GraphQL */ `
  query GetProducts(
    $first: Int = 24
    $after: String
    $query: String
    $sortKey: ProductSortKeys = BEST_SELLING
    $reverse: Boolean = false
  ) {
    products(
      first: $first
      after: $after
      query: $query
      sortKey: $sortKey
      reverse: $reverse
    ) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      nodes {
        ...ProductSummary
      }
    }
  }
  ${productSummaryFragment}
`;

const getProductQuery = /* GraphQL */ `
  query GetProduct($handle: String!) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${productFragment}
`;

type ProductsResponse = {
  products: {
    pageInfo: Paginated<ProductSummary>["pageInfo"];
    nodes: Array<Parameters<typeof mapProductSummary>[0]>;
  };
};

type ProductResponse = {
  product: Parameters<typeof mapProduct>[0] | null;
};

export function buildShopifyProductQuery(
  params: GetProductsParams,
): string | undefined {
  const parts: string[] = [];
  const collections = [
    ...(params.collections ?? []),
    ...(params.collection ? [params.collection] : []),
  ]
    .map((collection) => collection.trim())
    .filter(Boolean);
  const uniqueCollections = [...new Set(collections)];
  if (uniqueCollections.length === 1) {
    parts.push(`collection:${uniqueCollections[0]}`);
  } else if (uniqueCollections.length > 1) {
    parts.push(
      `(${uniqueCollections.map((collection) => `collection:${collection}`).join(" OR ")})`,
    );
  }
  if (params.query?.trim()) {
    parts.push(params.query.trim());
  }
  return parts.length ? parts.join(" AND ") : undefined;
}

export async function getProducts(
  params: GetProductsParams = {},
): Promise<Paginated<ProductSummary>> {
  const data = await shopifyFetch<ProductsResponse>({
    query: getProductsQuery,
    variables: {
      first: params.first ?? 24,
      after: params.after,
      query: buildShopifyProductQuery(params),
      sortKey: params.sortKey ?? "BEST_SELLING",
      reverse: params.reverse ?? false,
    },
    next: { revalidate: 60, tags: ["products"] },
  });

  return {
    items: data.products.nodes.map(mapProductSummary),
    pageInfo: data.products.pageInfo,
  };
}

export async function getProduct(handle: string): Promise<Product | null> {
  const data = await shopifyFetch<ProductResponse>({
    query: getProductQuery,
    variables: { handle },
    next: { revalidate: 60, tags: [`product:${handle}`] },
  });

  return data.product ? mapProduct(data.product) : null;
}
