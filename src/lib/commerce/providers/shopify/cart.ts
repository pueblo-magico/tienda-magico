import {
  CommerceError,
  type Cart,
  type CartLineInput,
  type CartLineUpdateInput,
} from "@/types/commerce";
import { shopifyFetch } from "./client";
import { cartFragment } from "./fragments";
import { assertNoUserErrors, mapCart } from "./mappers";

const getCartQuery = /* GraphQL */ `
  query GetCart($cartId: ID!) {
    cart(id: $cartId) {
      ...Cart
    }
  }
  ${cartFragment}
`;

const createCartMutation = /* GraphQL */ `
  mutation CreateCart($lines: [CartLineInput!], $note: String) {
    cartCreate(input: { lines: $lines, note: $note }) {
      cart {
        ...Cart
      }
      userErrors {
        field
        message
        code
      }
    }
  }
  ${cartFragment}
`;

const addCartLinesMutation = /* GraphQL */ `
  mutation AddCartLines($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        ...Cart
      }
      userErrors {
        field
        message
        code
      }
    }
  }
  ${cartFragment}
`;

const updateCartLinesMutation = /* GraphQL */ `
  mutation UpdateCartLines($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        ...Cart
      }
      userErrors {
        field
        message
        code
      }
    }
  }
  ${cartFragment}
`;

const removeCartLinesMutation = /* GraphQL */ `
  mutation RemoveCartLines($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        ...Cart
      }
      userErrors {
        field
        message
        code
      }
    }
  }
  ${cartFragment}
`;

type CartPayload = {
  cart: Parameters<typeof mapCart>[0] | null;
  userErrors: Array<{ field: string[] | null; message: string; code?: string | null }>;
};

type GetCartResponse = {
  cart: Parameters<typeof mapCart>[0] | null;
};

type CreateCartResponse = {
  cartCreate: CartPayload;
};

type AddCartLinesResponse = {
  cartLinesAdd: CartPayload;
};

type UpdateCartLinesResponse = {
  cartLinesUpdate: CartPayload;
};

type RemoveCartLinesResponse = {
  cartLinesRemove: CartPayload;
};

const cartFetchOptions = {
  cache: "no-store" as const,
};

export async function getCart(cartId: string): Promise<Cart | null> {
  const data = await shopifyFetch<GetCartResponse>({
    query: getCartQuery,
    variables: { cartId },
    ...cartFetchOptions,
  });

  return data.cart ? mapCart(data.cart) : null;
}

export async function createCart(input?: {
  lines?: CartLineInput[];
  note?: string;
}): Promise<Cart> {
  const data = await shopifyFetch<CreateCartResponse>({
    query: createCartMutation,
    variables: {
      lines: input?.lines,
      note: input?.note,
    },
    ...cartFetchOptions,
  });

  assertNoUserErrors(data.cartCreate.userErrors, "createCart");

  if (!data.cartCreate.cart) {
    throw new CommerceError("createCart failed: cart payload was empty.", { provider: "shopify" });
  }

  return mapCart(data.cartCreate.cart);
}

/** Alias matching COMMAND.md "Update Cart" — updates line quantities. */
export async function updateCart(
  cartId: string,
  lines: CartLineUpdateInput[],
): Promise<Cart> {
  return updateCartLines(cartId, lines);
}

export async function addCartLines(
  cartId: string,
  lines: CartLineInput[],
): Promise<Cart> {
  const data = await shopifyFetch<AddCartLinesResponse>({
    query: addCartLinesMutation,
    variables: { cartId, lines },
    ...cartFetchOptions,
  });

  assertNoUserErrors(data.cartLinesAdd.userErrors, "addCartLines");

  if (!data.cartLinesAdd.cart) {
    throw new CommerceError("addCartLines failed: cart payload was empty.", { provider: "shopify" });
  }

  return mapCart(data.cartLinesAdd.cart);
}

export async function updateCartLines(
  cartId: string,
  lines: CartLineUpdateInput[],
): Promise<Cart> {
  const data = await shopifyFetch<UpdateCartLinesResponse>({
    query: updateCartLinesMutation,
    variables: { cartId, lines },
    ...cartFetchOptions,
  });

  assertNoUserErrors(data.cartLinesUpdate.userErrors, "updateCartLines");

  if (!data.cartLinesUpdate.cart) {
    throw new CommerceError("updateCartLines failed: cart payload was empty.", { provider: "shopify" });
  }

  return mapCart(data.cartLinesUpdate.cart);
}

export async function removeCartLines(
  cartId: string,
  lineIds: string[],
): Promise<Cart> {
  const data = await shopifyFetch<RemoveCartLinesResponse>({
    query: removeCartLinesMutation,
    variables: { cartId, lineIds },
    ...cartFetchOptions,
  });

  assertNoUserErrors(data.cartLinesRemove.userErrors, "removeCartLines");

  if (!data.cartLinesRemove.cart) {
    throw new CommerceError("removeCartLines failed: cart payload was empty.", { provider: "shopify" });
  }

  return mapCart(data.cartLinesRemove.cart);
}
