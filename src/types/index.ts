export type { Locale, NavItem } from "@/config/navigation";

export type {
  Money,
  CommerceImage,
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
  GetProductParams,
  GetCollectionsParams,
  GetCollectionParams,
  Paginated,
  CommerceProviderName,
} from "./commerce";

export { CommerceError, CommerceConfigError } from "./commerce";

export type {
  CheckoutProviderName,
  CheckoutItem,
  CheckoutCustomer,
  CheckoutReturnUrls,
  CreateCheckoutSessionInput,
  CheckoutSession,
  CheckoutPaymentStatus,
  CheckoutPayment,
} from "./checkout";

export { CheckoutError, CheckoutConfigError } from "./checkout";

/** @deprecated Use CommerceError / types from `@/types/commerce`. */
export type { ShopifyImage } from "./shopify";
export { ShopifyError, ShopifyConfigError } from "./shopify";
