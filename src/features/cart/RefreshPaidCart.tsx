"use client";

import { useEffect } from "react";
import { useCart } from "./CartProvider";

export function RefreshPaidCart() {
  const { refreshCart } = useCart();
  useEffect(() => {
    void refreshCart();
    window.dispatchEvent(new Event("orders-updated"));
  }, [refreshCart]);
  return null;
}
