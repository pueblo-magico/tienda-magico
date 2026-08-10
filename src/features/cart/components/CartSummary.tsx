"use client";

import { useLocale } from "next-intl";
import type { Cart } from "@/types/commerce";
import { formatMoney } from "@/lib/commerce/utils/format";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

type Props = {
  cart: Cart;
  disabled?: boolean;
  onCheckout: () => void;
  labels: {
    subtotal: string;
    checkout: string;
    taxesNote: string;
  };
  className?: string;
};

export function CartSummary({
  cart,
  disabled,
  onCheckout,
  labels,
  className,
}: Props) {
  const locale = useLocale();

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm uppercase tracking-[0.12em] text-muted">
          {labels.subtotal}
        </span>
        <span className="font-serif text-xl text-forest">
          {formatMoney(cart.cost.subtotalAmount, locale)}
        </span>
      </div>
      <p className="text-xs text-muted">{labels.taxesNote}</p>
      <Button
        type="button"
        className="w-full"
        disabled={disabled || cart.totalQuantity === 0 || !cart.checkoutUrl}
        onClick={onCheckout}
      >
        {labels.checkout}
      </Button>
    </div>
  );
}
