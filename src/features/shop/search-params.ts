import type { GetProductsParams } from "@/types/commerce";
import { localizePath } from "@/config/navigation";
import {
  DEFAULT_SHOP_SORT,
  SHOP_PAGE_SIZE,
  type ShopSortValue,
} from "./constants";

export type ShopQuery = {
  q: string;
  sort: ShopSortValue;
  collection: string;
  /** Cursor (Shopify) or page number string (Payload). */
  after: string;
};

const SORT_VALUES: ShopSortValue[] = [
  "best",
  "newest",
  "title-asc",
  "title-desc",
  "price-asc",
  "price-desc",
];

export function parseShopQuery(
  input: Record<string, string | string[] | undefined>,
): ShopQuery {
  const read = (key: string) => {
    const value = input[key];
    return Array.isArray(value) ? value[0] ?? "" : value ?? "";
  };

  const sortRaw = read("sort");
  const sort = SORT_VALUES.includes(sortRaw as ShopSortValue)
    ? (sortRaw as ShopSortValue)
    : DEFAULT_SHOP_SORT;

  return {
    q: read("q").trim(),
    sort,
    collection: read("collection").trim(),
    after: read("after").trim(),
  };
}

export function sortToCommerce(
  sort: ShopSortValue,
): Pick<GetProductsParams, "sortKey" | "reverse"> {
  switch (sort) {
    case "newest":
      return { sortKey: "CREATED_AT", reverse: true };
    case "title-asc":
      return { sortKey: "TITLE", reverse: false };
    case "title-desc":
      return { sortKey: "TITLE", reverse: true };
    case "price-asc":
      return { sortKey: "PRICE", reverse: false };
    case "price-desc":
      return { sortKey: "PRICE", reverse: true };
    case "best":
    default:
      return { sortKey: "BEST_SELLING", reverse: false };
  }
}

export function toCommerceProductsParams(
  query: ShopQuery,
  locale: string,
): GetProductsParams {
  const sort = sortToCommerce(query.sort);
  return {
    first: SHOP_PAGE_SIZE,
    after: query.after || undefined,
    query: query.q || undefined,
    collection: query.collection || undefined,
    locale,
    sortKey: sort.sortKey,
    reverse: sort.reverse,
  };
}

/** Build a shop path preserving filters; omit empty values. */
export function buildShopHref(
  locale: string,
  query: Partial<ShopQuery>,
  options?: { dropAfter?: boolean },
): string {
  const params = new URLSearchParams();
  const q = query.q?.trim();
  const collection = query.collection?.trim();
  const sort = query.sort && query.sort !== DEFAULT_SHOP_SORT ? query.sort : "";
  const after = options?.dropAfter ? "" : query.after?.trim();

  if (q) params.set("q", q);
  if (collection) params.set("collection", collection);
  if (sort) params.set("sort", sort);
  if (after) params.set("after", after);

  const qs = params.toString();
  return localizePath(locale, qs ? `/shop?${qs}` : "/shop");
}
