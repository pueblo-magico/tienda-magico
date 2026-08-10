import type { CommerceProvider } from "@/lib/commerce/provider";
import type {
  Cart,
  CartLineInput,
  CartLineUpdateInput,
  Collection,
  CollectionSummary,
  GetCollectionsParams,
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

  getProduct(handle: string): Promise<Product | null> {
    return getProduct(handle);
  }

  getCollections(
    params?: GetCollectionsParams,
  ): Promise<Paginated<CollectionSummary>> {
    return getCollections(params);
  }

  getCollection(
    handle: string,
    productsFirst?: number,
  ): Promise<Collection | null> {
    return getCollection(handle, productsFirst);
  }

  getCart(cartId: string): Promise<Cart | null> {
    return getCart(cartId);
  }

  createCart(input?: {
    lines?: CartLineInput[];
    note?: string;
  }): Promise<Cart> {
    return createCart(input);
  }

  updateCart(cartId: string, lines: CartLineUpdateInput[]): Promise<Cart> {
    return updateCart(cartId, lines);
  }

  addCartLines(cartId: string, lines: CartLineInput[]): Promise<Cart> {
    return addCartLines(cartId, lines);
  }

  updateCartLines(
    cartId: string,
    lines: CartLineUpdateInput[],
  ): Promise<Cart> {
    return updateCartLines(cartId, lines);
  }

  removeCartLines(cartId: string, lineIds: string[]): Promise<Cart> {
    return removeCartLines(cartId, lineIds);
  }
}

export const shopifyCommerceProvider = new ShopifyCommerceProvider();
