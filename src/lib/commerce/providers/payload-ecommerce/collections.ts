import type {
  Collection,
  CollectionSummary,
  GetCollectionParams,
  GetCollectionsParams,
  Paginated,
  ProductSummary,
} from "@/types/commerce";
import { collectionPath, localeQuery, payloadFetch } from "./client";
import { getPayloadEcommerceConfig } from "./config";
import {
  mapCollection,
  mapCollectionSummary,
  mapProductSummary,
  pageInfoFromPayload,
  toId,
} from "./mappers";
import type { PayloadListResponse, PayloadProductDoc } from "./types";

type PayloadCollectionDoc = {
  id: string | number;
  title?: string | null;
  name?: string | null;
  slug?: string | null;
  handle?: string | null;
  description?: unknown;
  richText?: unknown;
  summary?: string | null;
  image?: unknown;
  media?: unknown;
  products?:
    | Array<string | number | PayloadProductDoc>
    | { docs?: Array<string | number | PayloadProductDoc> }
    | null;
};

function normalizeCollectionParams(
  productsFirstOrParams?: number | GetCollectionParams,
): GetCollectionParams {
  if (typeof productsFirstOrParams === "number") {
    return { productsFirst: productsFirstOrParams };
  }
  return productsFirstOrParams ?? {};
}

async function safeListCollections(params?: GetCollectionsParams) {
  const config = getPayloadEcommerceConfig();
  const limit = params?.first ?? 20;
  const page = params?.after ? Number.parseInt(params.after, 10) || 1 : 1;
  const locales = localeQuery(params?.locale);

  try {
    return await payloadFetch<PayloadListResponse<PayloadCollectionDoc>>({
      path: collectionPath(config.collectionsSlug),
      query: {
        depth: config.depth,
        limit,
        page,
        draft: false,
        ...locales,
      },
      cache: "force-cache",
      next: {
        revalidate: 120,
        tags: [
          "collections",
          "payload-collections",
          `collections:${locales.locale}`,
        ],
      },
    });
  } catch (error) {
    // Optional collection (categories/collections may not exist yet)
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      (error.status === 404 || error.status === 403)
    ) {
      return {
        docs: [],
        totalDocs: 0,
        limit,
        totalPages: 0,
        page,
        hasNextPage: false,
        hasPrevPage: false,
      } satisfies PayloadListResponse<PayloadCollectionDoc>;
    }
    throw error;
  }
}

export async function getCollections(
  params?: GetCollectionsParams,
): Promise<Paginated<CollectionSummary>> {
  const data = await safeListCollections(params);
  return {
    items: (data.docs ?? []).map(mapCollectionSummary),
    pageInfo: pageInfoFromPayload(data),
  };
}

function extractRelatedProducts(
  doc: PayloadCollectionDoc,
  productsFirst: number,
): ProductSummary[] {
  const raw = Array.isArray(doc.products)
    ? doc.products
    : Array.isArray(doc.products?.docs)
      ? doc.products.docs
      : [];

  return raw
    .map((item) => {
      if (item && typeof item === "object") {
        return mapProductSummary(item as PayloadProductDoc);
      }
      return null;
    })
    .filter((item): item is ProductSummary => Boolean(item))
    .slice(0, productsFirst);
}

export async function getCollection(
  handle: string,
  productsFirstOrParams: number | GetCollectionParams = 24,
): Promise<Collection | null> {
  const config = getPayloadEcommerceConfig();
  const params = normalizeCollectionParams(productsFirstOrParams);
  const productsFirst = params.productsFirst ?? 24;
  const locales = localeQuery(params.locale);

  try {
    const bySlug = await payloadFetch<PayloadListResponse<PayloadCollectionDoc>>({
      path: collectionPath(config.collectionsSlug),
      query: {
        depth: Math.max(config.depth, 2),
        limit: 1,
        "where[slug][equals]": handle,
        draft: false,
        ...locales,
      },
      cache: "force-cache",
      next: {
        revalidate: 60,
        tags: [
          `collection:${handle}`,
          `collection:${handle}:${locales.locale}`,
          "payload-collections",
        ],
      },
    });

    let doc = bySlug.docs?.[0];

    if (!doc) {
      doc = await payloadFetch<PayloadCollectionDoc>({
        path: collectionPath(config.collectionsSlug, handle),
        query: {
          depth: Math.max(config.depth, 2),
          draft: false,
          ...locales,
        },
        cache: "force-cache",
        next: {
          revalidate: 60,
          tags: [
            `collection:${handle}`,
            `collection:${handle}:${locales.locale}`,
            "payload-collections",
          ],
        },
      });
    }

    let products = extractRelatedProducts(doc, productsFirst);

    // Fallback: products that reference this category/collection id
    if (products.length === 0) {
      const related = await payloadFetch<PayloadListResponse<PayloadProductDoc>>({
        path: collectionPath(config.productsSlug),
        query: {
          depth: config.depth,
          limit: productsFirst,
          draft: false,
          ...locales,
          "where[or][0][category][equals]": toId(doc.id),
          "where[or][1][categories][contains]": toId(doc.id),
          "where[or][2][collections][contains]": toId(doc.id),
        },
        cache: "force-cache",
        next: {
          revalidate: 60,
          tags: [
            `collection:${handle}`,
            `collection:${handle}:${locales.locale}`,
            "payload-products",
          ],
        },
      });
      products = (related.docs ?? []).map(mapProductSummary);
    }

    return mapCollection(doc, products);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      (error.status === 404 || error.status === 403)
    ) {
      return null;
    }
    throw error;
  }
}
