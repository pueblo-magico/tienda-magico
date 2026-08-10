import type { CommerceProvider } from "@/lib/commerce/provider";
import type {
  Cart,
  CartLineInput,
  CartLineUpdateInput,
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
import {
  addCartLines,
  createCart,
  getCart,
  removeCartLines,
  updateCart,
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

  getProduct(handle: string, _params?: GetProductParams): Promise<Product | null> {
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

  getCart(cartId: string, _params?: { locale?: string | null }): Promise<Cart | null> {
    return getCart(cartId);
  }

  createCart(input?: {
    lines?: CartLineInput[];
    note?: string;
    locale?: string | null;
  }): Promise<Cart> {
    return createCart(input);
  }

  updateCart(
    cartId: string,
    lines: CartLineUpdateInput[],
    _params?: { locale?: string | null },
  ): Promise<Cart> {
    return updateCart(cartId, lines);
  }

  addCartLines(
    cartId: string,
    lines: CartLineInput[],
    _params?: { locale?: string | null },
  ): Promise<Cart> {
    return addCartLines(cartId, lines);
  }

  updateCartLines(
    cartId: string,
    lines: CartLineUpdateInput[],
    _params?: { locale?: string | null },
  ): Promise<Cart> {
    return updateCartLines(cartId, lines);
  }

  removeCartLines(
    cartId: string,
    lineIds: string[],
    _params?: { locale?: string | null },
  ): Promise<Cart> {
    return removeCartLines(cartId, lineIds);
  }
}

export const shopifyCommerceProvider = new ShopifyCommerceProvider();
