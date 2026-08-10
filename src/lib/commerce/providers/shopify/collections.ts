import type { Collection, CollectionSummary, Paginated } from "@/types/commerce";
import { shopifyFetch } from "./client";
import { collectionFragment, imageFragment } from "./fragments";
import { mapCollection, mapCollectionSummary } from "./mappers";

const getCollectionsQuery = /* GraphQL */ `
  query GetCollections($first: Int = 20, $after: String) {
    collections(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      nodes {
        id
        handle
        title
        description
        image {
          ...Image
        }
      }
    }
  }
  ${imageFragment}
`;

const getCollectionQuery = /* GraphQL */ `
  query GetCollection($handle: String!, $productsFirst: Int = 24) {
    collection(handle: $handle) {
      ...Collection
    }
  }
  ${collectionFragment}
`;

type CollectionsResponse = {
  collections: {
    pageInfo: Paginated<CollectionSummary>["pageInfo"];
    nodes: Array<Parameters<typeof mapCollectionSummary>[0]>;
  };
};

type CollectionResponse = {
  collection: Parameters<typeof mapCollection>[0] | null;
};

export async function getCollections(params?: {
  first?: number;
  after?: string;
}): Promise<Paginated<CollectionSummary>> {
  const data = await shopifyFetch<CollectionsResponse>({
    query: getCollectionsQuery,
    variables: {
      first: params?.first ?? 20,
      after: params?.after,
    },
    next: { revalidate: 120, tags: ["collections"] },
  });

  return {
    items: data.collections.nodes.map(mapCollectionSummary),
    pageInfo: data.collections.pageInfo,
  };
}

export async function getCollection(
  handle: string,
  productsFirst = 24,
): Promise<Collection | null> {
  const data = await shopifyFetch<CollectionResponse>({
    query: getCollectionQuery,
    variables: { handle, productsFirst },
    next: { revalidate: 60, tags: [`collection:${handle}`] },
  });

  return data.collection ? mapCollection(data.collection) : null;
}
