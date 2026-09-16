"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCart } from "@/features/cart/CartProvider";
import { Button } from "@/components/ui/Button";

export function RecoverOrders() {
  const { cart } = useCart();
  const router = useRouter();
  const t = useTranslations("orders");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <div className="space-y-3">
      <Button
        variant="secondary"
        disabled={busy || !cart?.id}
        onClick={async () => {
          setBusy(true);
          setFailed(false);
          try {
            const response = await fetch("/api/orders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ cartReference: cart.id }),
            });
            if (!response.ok) throw new Error();
            router.refresh();
          } catch {
            setFailed(true);
          } finally {
            setBusy(false);
          }
        }}
      >
        {t(busy ? "loading" : "recover")}
      </Button>
      {failed ? <p role="status">{t("recoverFailed")}</p> : null}
    </div>
  );
}
