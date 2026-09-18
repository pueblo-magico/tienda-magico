import type { CommerceProvider } from "@/lib/commerce/provider";
import type {
  Cart,
  CartLineInput,
  CartLineUpdateInput,
  CartParams,
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
import { isPayloadEcommerceConfigured } from "./config";
import { getProduct, getProducts } from "./products";
import {
  createCheckoutOrder,
  confirmGuestOrderReceipt,
  getCheckoutOrderByPublicReference,
  getGuestOrders,
  reportGuestTransfer,
} from "./orders";

export class PayloadEcommerceProvider implements CommerceProvider {
  readonly name = "payload" as const;

  isConfigured(): boolean {
    return isPayloadEcommerceConfigured();
  }

  getProducts(params?: GetProductsParams): Promise<Paginated<ProductSummary>> {
    return getProducts(params);
  }

  getProduct(
    handle: string,
    params?: GetProductParams,
  ): Promise<Product | null> {
    return getProduct(handle, params);
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
    return getCollection(handle, productsFirstOrParams);
  }

  getCart(cartId: string, params?: CartParams): Promise<Cart | null> {
    return getCart(cartId, params);
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
    return updateCart(cartId, lines, params);
  }

  addCartLines(
    cartId: string,
    lines: CartLineInput[],
    params?: CartParams,
  ): Promise<Cart> {
    return addCartLines(cartId, lines, params);
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
    params?: CartParams,
  ): Promise<Cart> {
    return removeCartLines(cartId, lineIds, params);
  }

  createCheckoutOrder = createCheckoutOrder;
  getCheckoutOrderByPublicReference = getCheckoutOrderByPublicReference;
  getGuestOrders = getGuestOrders;
  reportGuestTransfer = reportGuestTransfer;
  confirmGuestOrderReceipt = confirmGuestOrderReceipt;
}

export const payloadEcommerceProvider = new PayloadEcommerceProvider();
