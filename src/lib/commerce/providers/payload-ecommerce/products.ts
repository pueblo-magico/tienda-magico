import type { GetProductsParams, Paginated, Product, ProductSummary } from "@/types/commerce";
import { collectionPath, payloadFetch } from "./client";
import { getPayloadEcommerceConfig } from "./config";
import {
  mapProduct,
  mapProductSummary,
  pageInfoFromPayload,
  sortParam,
} from "./mappers";
import type { PayloadListResponse, PayloadProductDoc } from "./types";

export async function getProducts(
  params: GetProductsParams = {},
): Promise<Paginated<ProductSummary>> {
  const config = getPayloadEcommerceConfig();
  const limit = params.first ?? 24;
  const page = params.after ? Number.parseInt(params.after, 10) || 1 : 1;

  const query: Record<string, string | number | boolean> = {
    depth: config.depth,
    limit,
    page,
    draft: false,
  };

  const sort = sortParam(params.sortKey, params.reverse);
  if (sort) query.sort = sort;

  // Payload "where" query string syntax
  if (params.query) {
    query["where[or][0][title][contains]"] = params.query;
    query["where[or][1][slug][contains]"] = params.query;
  }

  const data = await payloadFetch<PayloadListResponse<PayloadProductDoc>>({
    path: collectionPath(config.productsSlug),
    query,
    cache: "force-cache",
    next: { revalidate: 60, tags: ["products", "payload-products"] },
  });

  return {
    items: (data.docs ?? []).map(mapProductSummary),
    pageInfo: pageInfoFromPayload(data),
  };
}

export async function getProduct(handle: string): Promise<Product | null> {
  const config = getPayloadEcommerceConfig();

  const bySlug = await payloadFetch<PayloadListResponse<PayloadProductDoc>>({
    path: collectionPath(config.productsSlug),
    query: {
      depth: config.depth,
      limit: 1,
      "where[slug][equals]": handle,
      draft: false,
    },
    cache: "force-cache",
    next: { revalidate: 60, tags: [`product:${handle}`, "payload-products"] },
  });

  const doc = bySlug.docs?.[0];
  if (doc) return mapProduct(doc);

  // Fallback: treat handle as document id
  try {
    const byId = await payloadFetch<PayloadProductDoc>({
      path: collectionPath(config.productsSlug, handle),
      query: { depth: config.depth, draft: false },
      cache: "force-cache",
      next: { revalidate: 60, tags: [`product:${handle}`, "payload-products"] },
    });
    return mapProduct(byId);
  } catch {
    return null;
  }
}
