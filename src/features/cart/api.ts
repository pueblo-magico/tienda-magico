import type { Cart, CartLineInput, CartLineUpdateInput } from "@/types/commerce";

type CartResponse = {
  cart: Cart;
  configured?: boolean;
  error?: string;
};

async function parseResponse(response: Response): Promise<CartResponse> {
  const data = (await response.json()) as CartResponse;
  if (!response.ok) {
    throw new Error(data.error || `Cart request failed (${response.status})`);
  }
  return data;
}

export async function fetchCart(cartId?: string | null): Promise<CartResponse> {
  const query = cartId ? `?cartId=${encodeURIComponent(cartId)}` : "";
  const response = await fetch(`/api/cart${query}`, {
    method: "GET",
    cache: "no-store",
  });
  return parseResponse(response);
}

export async function createCart(input?: {
  lines?: CartLineInput[];
  note?: string;
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
): Promise<CartResponse> {
  const response = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "add",
      cartId: cartId || undefined,
      lines,
    }),
  });
  return parseResponse(response);
}

export async function updateCartLines(
  cartId: string,
  lines: CartLineUpdateInput[],
): Promise<CartResponse> {
  const response = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "update", cartId, lines }),
  });
  return parseResponse(response);
}

export async function removeCartLines(
  cartId: string,
  lineIds: string[],
): Promise<CartResponse> {
  const response = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "remove", cartId, lineIds }),
  });
  return parseResponse(response);
}
