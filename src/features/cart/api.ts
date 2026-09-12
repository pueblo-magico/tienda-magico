import type {
  Cart,
  CartLineInput,
  CartLineUpdateInput,
} from "@/types/commerce";
import type { FulfillmentMode } from "@/lib/commerce/local-purchase";

export class CartRequestError extends Error {}

export async function confirmCartPrices(
  cartId: string,
  locale: string,
): Promise<CartResponse> {
  return parseResponse(
    await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "confirmPrices", cartId, locale }),
    }),
  );
}

type CartResponse = {
  cart: Cart;
  configured?: boolean;
  error?: string;
};

type LocaleOption = {
  locale?: string | null;
};

async function parseResponse(response: Response): Promise<CartResponse> {
  const data = (await response.json()) as CartResponse;
  if (!response.ok) {
    throw new CartRequestError("cartRequestFailed");
  }
  return data;
}

export async function fetchCart(
  cartId?: string | null,
  options?: LocaleOption,
): Promise<CartResponse> {
  const params = new URLSearchParams();
  if (cartId) params.set("cartId", cartId);
  if (options?.locale?.trim()) params.set("locale", options.locale.trim());
  const query = params.toString();
  const response = await fetch(`/api/cart${query ? `?${query}` : ""}`, {
    method: "GET",
    cache: "no-store",
  });
  return parseResponse(response);
}

export async function createCart(input?: {
  lines?: CartLineInput[];
  note?: string;
  locale?: string | null;
}): Promise<CartResponse> {
  const response = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "create", ...input }),
  });
  return parseResponse(response);
}

export async function addCartLines(
  cartId: string | null | undefined,
  lines: CartLineInput[],
  options?: LocaleOption,
): Promise<CartResponse> {
  const response = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "add",
      cartId: cartId || undefined,
      lines,
      locale: options?.locale || undefined,
    }),
  });
  return parseResponse(response);
}

export async function updateCartLines(
  cartId: string,
  lines: CartLineUpdateInput[],
  options?: LocaleOption,
): Promise<CartResponse> {
  const response = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "update",
      cartId,
      lines,
      locale: options?.locale || undefined,
    }),
  });
  return parseResponse(response);
}

export async function setCartFulfillmentMode(
  cartId: string,
  fulfillmentMode: FulfillmentMode,
  locale: string,
): Promise<CartResponse> {
  return parseResponse(
    await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "setFulfillmentMode",
        cartId,
        fulfillmentMode,
        locale,
      }),
    }),
  );
}

export async function removeCartLines(
  cartId: string,
  lineIds: string[],
  options?: LocaleOption,
): Promise<CartResponse> {
  const response = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "remove",
      cartId,
      lineIds,
      locale: options?.locale || undefined,
    }),
  });
  return parseResponse(response);
}
