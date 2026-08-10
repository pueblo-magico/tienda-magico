import type {
  GetProductParams,
  GetProductsParams,
  Paginated,
  Product,
  ProductSummary,
} from "@/types/commerce";
import { collectionPath, localeQuery, payloadFetch } from "./client";
import { getPayloadEcommerceConfig } from "./config";
import {
  mapProduct,
  mapProductSummary,
  pageInfoFromPayload,
  sortParam,
  toId,
} from "./mappers";
import type { PayloadListResponse, PayloadProductDoc } from "./types";

async function resolveCategoryId(
  handle: string,
  locales: Record<string, string>,
): Promise<string | null> {
  const config = getPayloadEcommerceConfig();
  try {
    const categories = await payloadFetch<
      PayloadListResponse<{ id: string | number; slug?: string }>
    >({
      path: collectionPath(config.collectionsSlug),
      query: {
        limit: 1,
        depth: 0,
        draft: false,
        "where[slug][equals]": handle,
        ...locales,
      },
      cache: "force-cache",
      next: { revalidate: 120, tags: ["collections", `collection:${handle}`] },
    });
    const catId = categories.docs?.[0]?.id;
    return catId != null ? toId(catId) : null;
  } catch {
    return null;
  }
}

/**
 * Build Payload REST `where` params.
 * Search and collection filters are AND-combined.
 */
function applyProductFilters(
  query: Record<string, string | number | boolean>,
  params: GetProductsParams,
  categoryId: string | null,
) {
  const search = params.query?.trim();
  const collection = params.collection?.trim();
  const andIndex = { value: 0 };

  const nextAnd = () => {
    const i = andIndex.value;
    andIndex.value += 1;
    return i;
  };

  if (search) {
    const i = nextAnd();
    query[`where[and][${i}][or][0][title][contains]`] = search;
    query[`where[and][${i}][or][1][slug][contains]`] = search;
  }

  if (collection) {
    const i = nextAnd();
    if (categoryId) {
      query[`where[and][${i}][or][0][category][equals]`] = categoryId;
      query[`where[and][${i}][or][1][category.slug][equals]`] = collection;
    } else {
      query[`where[and][${i}][or][0][category.slug][equals]`] = collection;
      query[`where[and][${i}][or][1][category][equals]`] = collection;
    }
  }
}

export async function getProducts(
  params: GetProductsParams = {},
): Promise<Paginated<ProductSummary>> {
  const config = getPayloadEcommerceConfig();
  const limit = params.first ?? 24;
  const page = params.after ? Number.parseInt(params.after, 10) || 1 : 1;
  const locales = localeQuery(params.locale);

  const query: Record<string, string | number | boolean> = {
    depth: config.depth,
    limit,
    page,
    draft: false,
    ...locales,
  };

  const sort = sortParam(params.sortKey, params.reverse);
  if (sort) query.sort = sort;

  let categoryId: string | null = null;
  if (params.collection?.trim()) {
    categoryId = await resolveCategoryId(params.collection.trim(), locales);
  }

  applyProductFilters(query, params, categoryId);

  const data = await payloadFetch<PayloadListResponse<PayloadProductDoc>>({
    path: collectionPath(config.productsSlug),
    query,
    cache: "force-cache",
    next: {
      revalidate: 60,
      tags: ["products", "payload-products", `products:${locales.locale}`],
    },
  });

  return {
    items: (data.docs ?? []).map(mapProductSummary),
    pageInfo: pageInfoFromPayload(data),
  };
}

export async function getProduct(
  handle: string,
  params: GetProductParams = {},
): Promise<Product | null> {
  const config = getPayloadEcommerceConfig();
  const locales = localeQuery(params.locale);

  const bySlug = await payloadFetch<PayloadListResponse<PayloadProductDoc>>({
    path: collectionPath(config.productsSlug),
    query: {
      depth: config.depth,
      limit: 1,
      "where[slug][equals]": handle,
      draft: false,
      ...locales,
    },
    cache: "force-cache",
    next: {
      revalidate: 60,
      tags: [
        `product:${handle}`,
        `product:${handle}:${locales.locale}`,
        "payload-products",
      ],
    },
  });

  const doc = bySlug.docs?.[0];
  if (doc) return mapProduct(doc);

  // Fallback: treat handle as document id
  try {
    const byId = await payloadFetch<PayloadProductDoc>({
      path: collectionPath(config.productsSlug, handle),
      query: { depth: config.depth, draft: false, ...locales },
      cache: "force-cache",
      next: {
        revalidate: 60,
        tags: [
          `product:${handle}`,
          `product:${handle}:${locales.locale}`,
          "payload-products",
        ],
      },
    });
    return mapProduct(byId);
  } catch {
    return null;
  }
}
