import type { CommerceProvider } from "@/lib/commerce/provider";
import type {
  Cart,
  CartLineInput,
  CartLineUpdateInput,
  CartParams,
  CheckoutOrder,
  Collection,
  CollectionSummary,
  GetCollectionParams,
  GetCollectionsParams,
  GetProductParams,
  GetProductsParams,
  Paginated,
  Product,
  ProductSummary,
} from "@/types/commerce";
import { CommerceError } from "@/types/commerce";
import { LOCAL_COLLECTION } from "@/lib/commerce/local-purchase";
import {
  addCartLines,
  createCart,
  getCart,
  removeCartLines,
  updateCartLines,
} from "./cart";
import { getCollection, getCollections } from "./collections";
import { isShopifyConfigured } from "./config";
import { getProduct, getProducts } from "./products";

export class ShopifyCommerceProvider implements CommerceProvider {
  readonly name = "shopify" as const;

  isConfigured(): boolean {
    return isShopifyConfigured();
  }

  getProducts(params?: GetProductsParams): Promise<Paginated<ProductSummary>> {
    return getProducts(params);
  }

  getProduct(
    handle: string,
    _params?: GetProductParams,
  ): Promise<Product | null> {
    // Shopify Markets/locale can be added later; Storefront adapter ignores locale for now.
    return getProduct(handle);
  }

  getCollections(
    params?: GetCollectionsParams,
  ): Promise<Paginated<CollectionSummary>> {
    return getCollections(params);
  }

  getCollection(
    handle: string,
    productsFirstOrParams?: number | GetCollectionParams,
  ): Promise<Collection | null> {
    const productsFirst =
      typeof productsFirstOrParams === "number"
        ? productsFirstOrParams
        : productsFirstOrParams?.productsFirst;
    return getCollection(handle, productsFirst);
  }

  getCart(
    cartId: string,
    _params?: { locale?: string | null },
  ): Promise<Cart | null> {
    return getCart(cartId);
  }

  createCart(input?: {
    lines?: CartLineInput[];
    note?: string;
    locale?: string | null;
    fulfillmentMode?: CartParams["fulfillmentMode"];
  }): Promise<Cart> {
    return createCart(input);
  }

  updateCart(
    cartId: string,
    lines: CartLineUpdateInput[],
    params?: CartParams,
  ): Promise<Cart> {
    return updateCartLines(cartId, lines, params);
  }

  addCartLines(
    cartId: string,
    lines: CartLineInput[],
    _params?: CartParams,
  ): Promise<Cart> {
    return addCartLines(cartId, lines);
  }

  updateCartLines(
    cartId: string,
    lines: CartLineUpdateInput[],
    params?: CartParams,
  ): Promise<Cart> {
    return updateCartLines(cartId, lines, params);
  }

  removeCartLines(
    cartId: string,
    lineIds: string[],
    _params?: CartParams,
  ): Promise<Cart> {
    return removeCartLines(cartId, lineIds);
  }

  async createCheckoutOrder(cart: Cart): Promise<CheckoutOrder | null> {
    if (cart.fulfillmentMode === LOCAL_COLLECTION) {
      throw new CommerceError(
        "El retiro local todavía no está disponible con Shopify.",
        { provider: "shopify", status: 400 },
      );
    }
    return null;
  }

  async getCheckoutOrderByPublicReference(): Promise<CheckoutOrder | null> {
    return null;
  }
  async getGuestOrders(): Promise<CheckoutOrder[]> {
    return [];
  }
  async reportGuestTransfer(): Promise<boolean> {
    return false;
  }
  async confirmGuestOrderReceipt(): Promise<boolean> {
    return false;
  }
  async cancelGuestCashOrder(): Promise<boolean> {
    return false;
  }
  async submitGuestOrderFeedback(): Promise<boolean> {
    return false;
  }
}

export const shopifyCommerceProvider = new ShopifyCommerceProvider();
