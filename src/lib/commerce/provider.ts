import type {
  Cart,
  CartLineInput,
  CartLineUpdateInput,
  CartParams,
  Collection,
  CollectionSummary,
  CommerceProviderName,
  GetCollectionParams,
  GetCollectionsParams,
  GetProductParams,
  GetProductsParams,
  Paginated,
  Product,
  ProductSummary,
} from "@/types/commerce";

/**
 * Provider-agnostic commerce contract.
 * Swap implementations (Shopify, Medusa, custom) without changing app code.
 */
export interface CommerceProvider {
  readonly name: CommerceProviderName;

  /** Whether required credentials/config are present. */
  isConfigured(): boolean;

  getProducts(params?: GetProductsParams): Promise<Paginated<ProductSummary>>;
  getProduct(handle: string, params?: GetProductParams): Promise<Product | null>;

  getCollections(params?: GetCollectionsParams): Promise<Paginated<CollectionSummary>>;
  getCollection(
    handle: string,
    productsFirstOrParams?: number | GetCollectionParams,
  ): Promise<Collection | null>;

  getCart(cartId: string, params?: CartParams): Promise<Cart | null>;
  createCart(input?: {
    lines?: CartLineInput[];
    note?: string;
    locale?: string | null;
  }): Promise<Cart>;
  /** Update line quantities (COMMAND: Update Cart). */
  updateCart(
    cartId: string,
    lines: CartLineUpdateInput[],
    params?: CartParams,
  ): Promise<Cart>;
  addCartLines(
    cartId: string,
    lines: CartLineInput[],
    params?: CartParams,
  ): Promise<Cart>;
  updateCartLines(
    cartId: string,
    lines: CartLineUpdateInput[],
    params?: CartParams,
  ): Promise<Cart>;
  removeCartLines(
    cartId: string,
    lineIds: string[],
    params?: CartParams,
  ): Promise<Cart>;
}
