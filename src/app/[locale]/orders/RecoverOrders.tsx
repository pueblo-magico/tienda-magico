"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCart } from "@/features/cart/CartProvider";
import { createOrderRecovery } from "@/features/orders/recovery";

export function RecoverOrders() {
  const { cart, isLoading } = useCart();
  const router = useRouter();
  const t = useTranslations("orders");
  const [recover] = useState(createOrderRecovery);
  const [refreshedCarts] = useState(() => new Set<string>());
  const [failedCart, setFailedCart] = useState<string | null>(null);
  const cartReference = cart.id;

  useEffect(() => {
    if (isLoading || !cartReference) return;
    let active = true;
    void recover(cartReference).then((result) => {
      if (!active) return;
      if (result === "recovered" && !refreshedCarts.has(cartReference)) {
        refreshedCarts.add(cartReference);
        router.refresh();
      }
      if (result === "failed") setFailedCart(cartReference);
    });
    return () => {
      active = false;
    };
  }, [cartReference, isLoading, recover, refreshedCarts, router]);

  return failedCart === cartReference ? (
    <p role="status" className="text-text-primary text-sm">
      {t("automaticRecoveryFailed")}
    </p>
  ) : null;
}
