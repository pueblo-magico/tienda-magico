/**
 * @deprecated Prefer `@/types/commerce` for provider-agnostic domain types.
 * Kept for COMMAND.md Phase 4 path compatibility — re-exports commerce types.
 */
export type {
  Money,
  CommerceImage as ShopifyImage,
  Product,
  ProductSummary,
  ProductVariant,
  ProductOption,
  SelectedOption,
  Collection,
  CollectionSummary,
  Cart,
  CartLine,
  CartLineMerchandise,
  CartLineInput,
  CartLineUpdateInput,
  GetProductsParams,
  GetCollectionsParams,
  Paginated,
  CommerceProviderName,
} from "./commerce";

export {
  CommerceError as ShopifyError,
  CommerceConfigError as ShopifyConfigError,
} from "./commerce";
