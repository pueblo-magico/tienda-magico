/**
 * @deprecated Import from `@/lib/commerce` instead.
 * Thin compatibility layer over the provider-agnostic commerce API.
 */
export {
  commerce,
  getCommerceProvider,
  createCommerceProvider,
  formatMoney,
  shopifyCommerceProvider,
} from "@/lib/commerce";

export {
  isShopifyConfigured,
  getShopifyConfig,
  shopifyFetch,
} from "@/lib/commerce/providers/shopify";

import { commerce } from "@/lib/commerce";

export const getProducts = commerce.getProducts;
export const getProduct = commerce.getProduct;
export const getCollections = commerce.getCollections;
export const getCollection = commerce.getCollection;
export const getCart = commerce.getCart;
export const createCart = commerce.createCart;
export const updateCart = commerce.updateCart;
export const addCartLines = commerce.addCartLines;
export const updateCartLines = commerce.updateCartLines;
export const removeCartLines = commerce.removeCartLines;
