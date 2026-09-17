"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Cart, CartLineInput } from "@/types/commerce";
import type { FulfillmentMode } from "@/lib/commerce/local-purchase";
import { CASH, MERCADO_PAGO, type PaymentMethod } from "@/types/checkout";
import { createCheckoutSession } from "@/features/checkout";
import {
  addCartLines,
  confirmCartPrices,
  fetchCart,
  removeCartLines,
  setCartFulfillmentMode,
  updateCartLines,
} from "./api";
import { CART_ID_STORAGE_KEY } from "./constants";
import {
  DEFAULT_COMMERCE_SETTINGS,
  type CommerceSettings,
} from "@/lib/commerce/commerce-settings";

function emptyCart(): Cart {
  return {
    id: "",
    checkoutUrl: "",
    fulfillmentMode: null,
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
  commerceSettings: CommerceSettings;
  paymentMethod: PaymentMethod;
  buyerName: string;
  buyerEmail: string;
  identification: { type: string; number: string };
  setIdentification: (value: { type: string; number: string }) => void;
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
  setPaymentMethod: (method: PaymentMethod) => void;
  setBuyerName: (name: string) => void;
  setBuyerEmail: (email: string) => void;
  clearError: () => void;
  confirmPrices: () => Promise<void>;
  setFulfillmentMode: (mode: FulfillmentMode) => Promise<void>;
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
  const tCommercial = useTranslations("commercial");
  const [cart, setCart] = useState<Cart>(emptyCart);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(true);
  const [commerceSettings, setCommerceSettings] = useState<CommerceSettings>(
    DEFAULT_COMMERCE_SETTINGS,
  );
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>(MERCADO_PAGO);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [identification, setIdentification] = useState({
    type: "DNI",
    number: "",
  });
  const persistedCartRef = useRef<Cart>(emptyCart());
  const fulfillmentModeRef = useRef<FulfillmentMode | null>(null);
  const fulfillmentMutationQueue = useRef<Promise<void>>(Promise.resolve());
  const pendingFulfillmentMutations = useRef(0);

  const applyCart = useCallback((next: Cart, isConfigured = true) => {
    const normalized = next.id ? next : emptyCart();
    persistedCartRef.current = normalized;
    fulfillmentModeRef.current = normalized.fulfillmentMode;
    setCart(normalized);
    setConfigured(isConfigured);
    writeStoredCartId(next.id || null);
  }, []);

  const refreshCart = useCallback(async () => {
    const cartId = readStoredCartId();
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchCart(cartId, { locale });
      if (result.commerceSettings) setCommerceSettings(result.commerceSettings);
      applyCart(result.cart, result.configured !== false);
      if (cartId && !result.cart.id) {
        writeStoredCartId(null);
      }
    } catch {
      // A transient fetch/pricing failure must not discard an existing cart.
      setError(tCommercial("requestFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [applyCart, locale, tCommercial]);

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
      } catch {
        setError(tCommercial("requestFailed"));
        return null;
      } finally {
        setIsMutating(false);
      }
    },
    [applyCart, locale, tCommercial],
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
      } catch {
        setError(tCommercial("requestFailed"));
        return null;
      } finally {
        setIsMutating(false);
      }
    },
    [applyCart, cart.id, locale, tCommercial],
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
      } catch {
        setError(tCommercial("requestFailed"));
        return null;
      } finally {
        setIsMutating(false);
      }
    },
    [applyCart, cart.id, locale, tCommercial],
  );

  const confirmPrices = useCallback(async () => {
    const cartId = readStoredCartId() || cart.id;
    if (!cartId) return;
    setIsMutating(true);
    setError(null);
    try {
      const result = await confirmCartPrices(cartId, locale);
      applyCart(result.cart, result.configured !== false);
    } catch {
      setError(tCommercial("requestFailed"));
    } finally {
      setIsMutating(false);
    }
  }, [applyCart, cart.id, locale, tCommercial]);

  const setFulfillment = useCallback(
    async (mode: FulfillmentMode) => {
      const cartId = readStoredCartId() || cart.id;
      if (!cartId) return;

      if (mode !== "local_collection" && paymentMethod === CASH) {
        setPaymentMethod(MERCADO_PAGO);
      }

      fulfillmentModeRef.current = mode;
      setCart((current) => ({ ...current, fulfillmentMode: mode }));
      pendingFulfillmentMutations.current += 1;
      setIsMutating(true);
      setError(null);

      const request = fulfillmentMutationQueue.current.then(async () => {
        const result = await setCartFulfillmentMode(cartId, mode, locale);
        persistedCartRef.current = result.cart;
        if (fulfillmentModeRef.current === mode) {
          applyCart(result.cart, result.configured !== false);
        }
      });
      fulfillmentMutationQueue.current = request.catch(() => undefined);

      try {
        await request;
      } catch {
        if (fulfillmentModeRef.current === mode) {
          applyCart(persistedCartRef.current);
          setError(tCommercial("requestFailed"));
        }
      } finally {
        pendingFulfillmentMutations.current -= 1;
        if (pendingFulfillmentMutations.current === 0) {
          setIsMutating(false);
        }
      }
    },
    [applyCart, cart.id, locale, paymentMethod, tCommercial],
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
        paymentMethod,
        name: buyerName,
        email: buyerEmail,
        identification:
          paymentMethod === "bank-transfer" ? identification : undefined,
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
  }, [
    buyerEmail,
    buyerName,
    identification,
    cart.id,
    cart.totalQuantity,
    locale,
    paymentMethod,
  ]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      isOpen,
      isLoading,
      isMutating,
      error,
      configured,
      commerceSettings,
      paymentMethod,
      buyerName,
      buyerEmail,
      identification,
      setIdentification,
      itemCount: cart.totalQuantity,
      openCart,
      closeCart,
      toggleCart,
      refreshCart,
      addItem,
      updateItemQuantity,
      removeItem,
      checkout,
      setPaymentMethod,
      setBuyerName,
      setBuyerEmail,
      clearError,
      confirmPrices,
      setFulfillmentMode: setFulfillment,
    }),
    [
      cart,
      isOpen,
      isLoading,
      isMutating,
      error,
      configured,
      commerceSettings,
      paymentMethod,
      buyerName,
      buyerEmail,
      identification,
      openCart,
      closeCart,
      toggleCart,
      refreshCart,
      addItem,
      updateItemQuantity,
      removeItem,
      checkout,
      clearError,
      confirmPrices,
      setFulfillment,
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
