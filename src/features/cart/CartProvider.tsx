"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocale } from "next-intl";
import type { Cart, CartLineInput } from "@/types/commerce";
import { createCheckoutSession } from "@/features/checkout";
import {
  addCartLines,
  fetchCart,
  removeCartLines,
  updateCartLines,
} from "./api";
import { CART_ID_STORAGE_KEY } from "./constants";

function emptyCart(): Cart {
  return {
    id: "",
    checkoutUrl: "",
    totalQuantity: 0,
    note: null,
    cost: {
      subtotalAmount: { amount: "0.00", currencyCode: "ARS" },
      totalAmount: { amount: "0.00", currencyCode: "ARS" },
      totalTaxAmount: null,
    },
    lines: [],
  };
}

type CartContextValue = {
  cart: Cart;
  isOpen: boolean;
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  configured: boolean;
  itemCount: number;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  refreshCart: () => Promise<void>;
  addItem: (input: CartLineInput | CartLineInput[]) => Promise<Cart | null>;
  updateItemQuantity: (
    lineId: string,
    quantity: number,
  ) => Promise<Cart | null>;
  removeItem: (lineId: string) => Promise<Cart | null>;
  checkout: () => Promise<void>;
  clearError: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function readStoredCartId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(CART_ID_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredCartId(cartId: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (!cartId) {
      window.localStorage.removeItem(CART_ID_STORAGE_KEY);
    } else {
      window.localStorage.setItem(CART_ID_STORAGE_KEY, cartId);
    }
  } catch {
    // ignore quota / private mode
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const [cart, setCart] = useState<Cart>(emptyCart);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(true);

  const applyCart = useCallback((next: Cart, isConfigured = true) => {
    setCart(next.id ? next : emptyCart());
    setConfigured(isConfigured);
    writeStoredCartId(next.id || null);
  }, []);

  const refreshCart = useCallback(async () => {
    const cartId = readStoredCartId();
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchCart(cartId, { locale });
      applyCart(result.cart, result.configured !== false);
      if (cartId && !result.cart.id) {
        writeStoredCartId(null);
      }
    } catch (err) {
      // A transient fetch/pricing failure must not discard an existing cart.
      setError(err instanceof Error ? err.message : "Failed to load cart.");
    } finally {
      setIsLoading(false);
    }
  }, [applyCart, locale]);

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((value) => !value), []);
  const clearError = useCallback(() => setError(null), []);

  const addItem = useCallback(
    async (input: CartLineInput | CartLineInput[]) => {
      const lines = Array.isArray(input) ? input : [input];
      setIsMutating(true);
      setError(null);
      try {
        const result = await addCartLines(readStoredCartId(), lines, {
          locale,
        });
        applyCart(result.cart, result.configured !== false);
        setIsOpen(true);
        return result.cart;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add to cart.");
        return null;
      } finally {
        setIsMutating(false);
      }
    },
    [applyCart, locale],
  );

  const updateItemQuantity = useCallback(
    async (lineId: string, quantity: number) => {
      const cartId = readStoredCartId() || cart.id;
      if (!cartId) return null;

      setIsMutating(true);
      setError(null);
      try {
        if (quantity <= 0) {
          const result = await removeCartLines(cartId, [lineId], { locale });
          applyCart(result.cart, result.configured !== false);
          return result.cart;
        }

        const result = await updateCartLines(
          cartId,
          [{ id: lineId, quantity }],
          { locale },
        );
        applyCart(result.cart, result.configured !== false);
        return result.cart;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update cart.");
        return null;
      } finally {
        setIsMutating(false);
      }
    },
    [applyCart, cart.id, locale],
  );

  const removeItem = useCallback(
    async (lineId: string) => {
      const cartId = readStoredCartId() || cart.id;
      if (!cartId) return null;

      setIsMutating(true);
      setError(null);
      try {
        const result = await removeCartLines(cartId, [lineId], { locale });
        applyCart(result.cart, result.configured !== false);
        return result.cart;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to remove item.");
        return null;
      } finally {
        setIsMutating(false);
      }
    },
    [applyCart, cart.id, locale],
  );

  const checkout = useCallback(async () => {
    const cartId = readStoredCartId() || cart.id;
    if (!cartId || cart.totalQuantity <= 0) {
      setError("Checkout is not available for this cart yet.");
      return;
    }

    setIsMutating(true);
    setError(null);
    try {
      const result = await createCheckoutSession({
        cartId,
        locale,
      });
      const redirectUrl = result.session?.redirectUrl;
      if (!redirectUrl) {
        setError("Checkout is not available for this cart yet.");
        return;
      }
      window.location.assign(redirectUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not start checkout.",
      );
    } finally {
      setIsMutating(false);
    }
  }, [cart.id, cart.totalQuantity, locale]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      isOpen,
      isLoading,
      isMutating,
      error,
      configured,
      itemCount: cart.totalQuantity,
      openCart,
      closeCart,
      toggleCart,
      refreshCart,
      addItem,
      updateItemQuantity,
      removeItem,
      checkout,
      clearError,
    }),
    [
      cart,
      isOpen,
      isLoading,
      isMutating,
      error,
      configured,
      openCart,
      closeCart,
      toggleCart,
      refreshCart,
      addItem,
      updateItemQuantity,
      removeItem,
      checkout,
      clearError,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider.");
  }
  return context;
}
