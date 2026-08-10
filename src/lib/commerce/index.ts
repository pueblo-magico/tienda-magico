import { createCommerceProvider } from "./create-provider";
import type { CommerceProvider } from "./provider";

export type { CommerceProvider } from "./provider";
export { createCommerceProvider, resolveCommerceProviderName } from "./create-provider";
export { formatMoney } from "./utils/format";
export { shopifyCommerceProvider } from "./providers/shopify";

/** Singleton active commerce provider (selected via COMMERCE_PROVIDER). */
let cached: CommerceProvider | null = null;

export function getCommerceProvider(): CommerceProvider {
  if (!cached) {
    cached = createCommerceProvider();
  }
  return cached;
}

/** Test helper — reset cached provider instance. */
export function __resetCommerceProviderForTests() {
  cached = null;
}

// Convenience facades so app code can call commerce helpers directly.
export const commerce = {
  get provider() {
    return getCommerceProvider();
  },
  isConfigured: () => getCommerceProvider().isConfigured(),
  getProducts: (...args: Parameters<CommerceProvider["getProducts"]>) =>
    getCommerceProvider().getProducts(...args),
  getProduct: (...args: Parameters<CommerceProvider["getProduct"]>) =>
    getCommerceProvider().getProduct(...args),
  getCollections: (...args: Parameters<CommerceProvider["getCollections"]>) =>
    getCommerceProvider().getCollections(...args),
  getCollection: (...args: Parameters<CommerceProvider["getCollection"]>) =>
    getCommerceProvider().getCollection(...args),
  getCart: (...args: Parameters<CommerceProvider["getCart"]>) =>
    getCommerceProvider().getCart(...args),
  createCart: (...args: Parameters<CommerceProvider["createCart"]>) =>
    getCommerceProvider().createCart(...args),
  updateCart: (...args: Parameters<CommerceProvider["updateCart"]>) =>
    getCommerceProvider().updateCart(...args),
  addCartLines: (...args: Parameters<CommerceProvider["addCartLines"]>) =>
    getCommerceProvider().addCartLines(...args),
  updateCartLines: (...args: Parameters<CommerceProvider["updateCartLines"]>) =>
    getCommerceProvider().updateCartLines(...args),
  removeCartLines: (...args: Parameters<CommerceProvider["removeCartLines"]>) =>
    getCommerceProvider().removeCartLines(...args),
};
