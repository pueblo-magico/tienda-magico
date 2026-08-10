import { CommerceError, type Cart, type CartLineInput, type CartLineUpdateInput } from "@/types/commerce";
import { collectionPath, payloadFetch } from "./client";
import { getPayloadEcommerceConfig } from "./config";
import { decodeCartRef, encodeCartRef, mapCart, toId } from "./mappers";
import type {
  PayloadCartDoc,
  PayloadCartMutationResult,
  PayloadProductDoc,
  PayloadVariantDoc,
} from "./types";

type ResolvedMerchandise = {
  productId: string;
  variantId?: string;
};

function cartPath(cartId: string, action?: string) {
  const config = getPayloadEcommerceConfig();
  const base = collectionPath(config.cartsSlug, cartId);
  return action ? `${base}/${action}` : base;
}

async function findVariant(merchandiseId: string): Promise<PayloadVariantDoc | null> {
  const config = getPayloadEcommerceConfig();
  try {
    return await payloadFetch<PayloadVariantDoc>({
      path: collectionPath(config.variantsSlug, merchandiseId),
      query: { depth: 1 },
      cache: "no-store",
    });
  } catch {
    return null;
  }
}

async function findProduct(merchandiseId: string): Promise<PayloadProductDoc | null> {
  const config = getPayloadEcommerceConfig();
  try {
    return await payloadFetch<PayloadProductDoc>({
      path: collectionPath(config.productsSlug, merchandiseId),
      query: { depth: 0 },
      cache: "no-store",
    });
  } catch {
    return null;
  }
}

/**
 * merchandiseId formats supported:
 * - "variantId"
 * - "productId"
 * - "product:productId"
 * - "variant:variantId"
 * - "productId:variantId"
 */
export async function resolveMerchandise(
  merchandiseId: string,
): Promise<ResolvedMerchandise> {
  const raw = merchandiseId.trim();

  if (raw.startsWith("product:")) {
    return { productId: raw.slice("product:".length) };
  }
  if (raw.startsWith("variant:")) {
    const variantId = raw.slice("variant:".length);
    const variant = await findVariant(variantId);
    const productId = toId(variant?.product);
    if (!productId) {
      throw new CommerceError(`Variant "${variantId}" has no linked product.`, {
        provider: "payload",
      });
    }
    return { productId, variantId };
  }

  if (raw.includes(":") && !raw.startsWith("gid://")) {
    const [productId, variantId] = raw.split(":");
    if (productId && variantId) {
      return { productId, variantId };
    }
  }

  const variant = await findVariant(raw);
  if (variant) {
    const productId = toId(variant.product);
    if (!productId) {
      throw new CommerceError(`Variant "${raw}" has no linked product.`, {
        provider: "payload",
      });
    }
    return { productId, variantId: toId(variant.id) };
  }

  const product = await findProduct(raw);
  if (product) {
    return { productId: toId(product.id) };
  }

  throw new CommerceError(`Unable to resolve merchandise id "${merchandiseId}".`, {
    provider: "payload",
  });
}

async function fetchCartDocument(cartId: string, secret?: string): Promise<PayloadCartDoc> {
  const config = getPayloadEcommerceConfig();
  return payloadFetch<PayloadCartDoc>({
    path: collectionPath(config.cartsSlug, cartId),
    query: {
      depth: Math.max(config.depth, 2),
      ...(secret ? { secret } : {}),
    },
    cache: "no-store",
  });
}

function isCartDoc(value: unknown): value is PayloadCartDoc {
  return Boolean(
    value &&
      typeof value === "object" &&
      "id" in value &&
      (value as { id: unknown }).id != null,
  );
}

function extractCartDoc(
  result: PayloadCartMutationResult | PayloadCartDoc,
): PayloadCartDoc | null {
  if (isCartDoc(result)) {
    return result;
  }

  if (
    result &&
    typeof result === "object" &&
    "cart" in result &&
    isCartDoc((result as PayloadCartMutationResult).cart)
  ) {
    return (result as PayloadCartMutationResult).cart as PayloadCartDoc;
  }

  // Payload REST create often wraps the document as { doc: ... }
  if (
    result &&
    typeof result === "object" &&
    "doc" in result &&
    isCartDoc((result as { doc?: unknown }).doc)
  ) {
    return (result as { doc: PayloadCartDoc }).doc;
  }

  return null;
}

function extractSecret(
  result: PayloadCartMutationResult | PayloadCartDoc | { doc?: PayloadCartDoc; secret?: string },
  cartDoc: PayloadCartDoc,
  fallbackSecret?: string,
): string | null {
  if (result && typeof result === "object" && "secret" in result) {
    const secret = (result as { secret?: string | null }).secret;
    if (secret) return secret;
  }

  return cartDoc.secret ?? fallbackSecret ?? null;
}

function withPreservedSecret(cart: Cart, secret?: string | null): Cart {
  if (!secret || cart.id.includes("::")) {
    return cart;
  }

  const { cartId } = decodeCartRef(cart.id);
  const cartRef = encodeCartRef(cartId, secret);

  let checkoutUrl = cart.checkoutUrl;
  try {
    const url = new URL(cart.checkoutUrl);
    url.searchParams.set("cart", cartRef);
    checkoutUrl = url.toString();
  } catch {
    if (/([?&])cart=/.test(cart.checkoutUrl)) {
      checkoutUrl = cart.checkoutUrl.replace(
        /([?&])cart=[^&]*/,
        `$1cart=${encodeURIComponent(cartRef)}`,
      );
    } else {
      const join = cart.checkoutUrl.includes("?") ? "&" : "?";
      checkoutUrl = `${cart.checkoutUrl}${join}cart=${encodeURIComponent(cartRef)}`;
    }
  }

  return {
    ...cart,
    id: cartRef,
    checkoutUrl,
  };
}

function resultToCart(
  result: PayloadCartMutationResult | PayloadCartDoc,
  fallbackSecret?: string,
): Cart {
  const config = getPayloadEcommerceConfig();
  const cartDoc = extractCartDoc(result);

  if (!cartDoc) {
    throw new CommerceError("Payload cart response did not include a cart document.", {
      provider: "payload",
      errors: result,
    });
  }

  const secret = extractSecret(result, cartDoc, fallbackSecret);
  const cart = mapCart(cartDoc, {
    secret,
    checkoutBaseUrl: config.checkoutBaseUrl,
  });

  return withPreservedSecret(cart, secret ?? undefined);
}

export async function getCart(cartRef: string): Promise<Cart | null> {
  const { cartId, secret } = decodeCartRef(cartRef);

  try {
    const cart = await fetchCartDocument(cartId, secret);
    return mapCart(cart, { secret: secret ?? cart.secret });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      (error.status === 404 || error.status === 403)
    ) {
      return null;
    }
    throw error;
  }
}

export async function createCart(input?: {
  lines?: CartLineInput[];
  note?: string;
}): Promise<Cart> {
  const config = getPayloadEcommerceConfig();

  // Create empty cart first (guest carts require allowGuestCarts on Payload side)
  const created = await payloadFetch<PayloadCartMutationResult | PayloadCartDoc | { doc: PayloadCartDoc }>({
    method: "POST",
    path: collectionPath(config.cartsSlug),
    body: {
      items: [],
      ...(input?.note ? { note: input.note } : {}),
      currency: config.currencyCode,
    },
    cache: "no-store",
  });

  let cart = resultToCart(created as PayloadCartMutationResult | PayloadCartDoc);

  if (input?.lines?.length) {
    cart = await addCartLines(cart.id, input.lines);
  }

  return cart;
}

export async function addCartLines(
  cartRef: string,
  lines: CartLineInput[],
): Promise<Cart> {
  const { cartId, secret } = decodeCartRef(cartRef);
  let latest: Cart | null = null;

  for (const line of lines) {
    const merchandise = await resolveMerchandise(line.merchandiseId);
    const result = await payloadFetch<PayloadCartMutationResult>({
      method: "POST",
      path: cartPath(cartId, "add-item"),
      body: {
        item: {
          product: merchandise.productId,
          ...(merchandise.variantId ? { variant: merchandise.variantId } : {}),
        },
        quantity: line.quantity,
        ...(secret ? { secret } : {}),
      },
      cache: "no-store",
    });

    if (result.success === false) {
      throw new CommerceError(result.message ?? "addCartLines failed.", {
        provider: "payload",
        errors: result,
      });
    }

    latest = resultToCart(result, secret);
  }

  if (!latest) {
    const existing = await getCart(cartRef);
    if (!existing) {
      throw new CommerceError("Cart not found after addCartLines.", {
        provider: "payload",
      });
    }
    return existing;
  }

  return withPreservedSecret(latest, secret);
}

export async function updateCartLines(
  cartRef: string,
  lines: CartLineUpdateInput[],
): Promise<Cart> {
  const { cartId, secret } = decodeCartRef(cartRef);
  let latest: Cart | null = null;

  for (const line of lines) {
    const result = await payloadFetch<PayloadCartMutationResult>({
      method: "POST",
      path: cartPath(cartId, "update-item"),
      body: {
        itemID: line.id,
        quantity: line.quantity,
        removeOnZero: true,
        ...(secret ? { secret } : {}),
      },
      cache: "no-store",
    });

    if (result.success === false) {
      throw new CommerceError(result.message ?? "updateCartLines failed.", {
        provider: "payload",
        errors: result,
      });
    }

    latest = resultToCart(result, secret);
  }

  if (!latest) {
    const existing = await getCart(cartRef);
    if (!existing) {
      throw new CommerceError("Cart not found after updateCartLines.", {
        provider: "payload",
      });
    }
    return existing;
  }

  return withPreservedSecret(latest, secret);
}

export async function updateCart(
  cartRef: string,
  lines: CartLineUpdateInput[],
): Promise<Cart> {
  return updateCartLines(cartRef, lines);
}

export async function removeCartLines(
  cartRef: string,
  lineIds: string[],
): Promise<Cart> {
  const { cartId, secret } = decodeCartRef(cartRef);
  let latest: Cart | null = null;

  for (const itemID of lineIds) {
    const result = await payloadFetch<PayloadCartMutationResult>({
      method: "POST",
      path: cartPath(cartId, "remove-item"),
      body: {
        itemID,
        ...(secret ? { secret } : {}),
      },
      cache: "no-store",
    });

    if (result.success === false) {
      throw new CommerceError(result.message ?? "removeCartLines failed.", {
        provider: "payload",
        errors: result,
      });
    }

    latest = resultToCart(result, secret);
  }

  if (!latest) {
    const existing = await getCart(cartRef);
    if (!existing) {
      throw new CommerceError("Cart not found after removeCartLines.", {
        provider: "payload",
      });
    }
    return existing;
  }

  return withPreservedSecret(latest, secret);
}
