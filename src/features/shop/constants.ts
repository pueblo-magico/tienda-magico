export const SHOP_PAGE_SIZE = 12;

export type ShopSortValue =
  | "best"
  | "newest"
  | "title-asc"
  | "title-desc"
  | "price-asc"
  | "price-desc";

export const DEFAULT_SHOP_SORT: ShopSortValue = "best";
