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
  categoryPath: string[];
  categories: string[];
  minPrice: string;
  maxPrice: string;
  tags: string[];
  origins: string[];
  availableOnly: boolean;
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
  categoryPath: string[] = [],
): ShopQuery {
  const read = (key: string) => {
    const value = input[key];
    return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
  };

  const sortRaw = read("sort");
  const sort = SORT_VALUES.includes(sortRaw as ShopSortValue)
    ? (sortRaw as ShopSortValue)
    : DEFAULT_SHOP_SORT;

  const readList = (key: string) => [
    ...new Set(
      read(key)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];
  const readHandles = (key: string) =>
    readList(key).filter((value) =>
      /^[\p{L}\p{N}][\p{L}\p{M}\p{N}_-]*$/u.test(value),
    );

  return {
    q: read("q").trim(),
    sort,
    collection: categoryPath.at(-1) ?? read("collection").trim(),
    categoryPath,
    categories: readHandles("categories"),
    minPrice: read("minPrice").trim(),
    maxPrice: read("maxPrice").trim(),
    tags: readList("tags"),
    origins: read("origins")
      .split(",")
      .map((origin) => origin.trim().toUpperCase())
      .filter(Boolean),
    availableOnly: read("availability") === "available",
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
    collections: query.categories.length
      ? query.categories
      : query.collection
        ? [query.collection]
        : undefined,
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
  const categoryPath = query.categoryPath?.filter(Boolean) ?? [];
  const categories = query.categories?.filter(Boolean) ?? [];
  const sort = query.sort && query.sort !== DEFAULT_SHOP_SORT ? query.sort : "";
  const after = options?.dropAfter ? "" : query.after?.trim();
  const minPrice = query.minPrice?.trim();
  const maxPrice = query.maxPrice?.trim();
  const tags = query.tags?.filter(Boolean) ?? [];
  const origins = query.origins?.filter(Boolean) ?? [];

  if (q) params.set("q", q);
  if (categories.length) params.set("categories", categories.join(","));
  if (sort) params.set("sort", sort);
  if (minPrice) params.set("minPrice", minPrice);
  if (maxPrice) params.set("maxPrice", maxPrice);
  if (tags.length) params.set("tags", tags.join(","));
  if (origins.length) params.set("origins", origins.join(","));
  if (query.availableOnly) params.set("availability", "available");
  if (after) params.set("after", after);

  const qs = params.toString();
  const shopPath = categoryPath.length
    ? `/shop/categories/${categoryPath.map(encodeURIComponent).join("/")}`
    : "/shop";
  return localizePath(locale, qs ? `${shopPath}?${qs}` : shopPath);
}
