"use client";

import { useEffect } from "react";
import { useCart } from "./CartProvider";

export function RefreshPaidCart() {
  const { refreshCart } = useCart();
  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);
  return null;
}
