import type {
  Cart,
  CartLineInput,
  CartLineUpdateInput,
  Collection,
  CollectionSummary,
  CommerceProviderName,
  GetCollectionsParams,
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
  getProduct(handle: string): Promise<Product | null>;

  getCollections(params?: GetCollectionsParams): Promise<Paginated<CollectionSummary>>;
  getCollection(handle: string, productsFirst?: number): Promise<Collection | null>;

  getCart(cartId: string): Promise<Cart | null>;
  createCart(input?: { lines?: CartLineInput[]; note?: string }): Promise<Cart>;
  /** Update line quantities (COMMAND: Update Cart). */
  updateCart(cartId: string, lines: CartLineUpdateInput[]): Promise<Cart>;
  addCartLines(cartId: string, lines: CartLineInput[]): Promise<Cart>;
  updateCartLines(cartId: string, lines: CartLineUpdateInput[]): Promise<Cart>;
  removeCartLines(cartId: string, lineIds: string[]): Promise<Cart>;
}
