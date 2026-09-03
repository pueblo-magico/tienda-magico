"use client";

import { useLocale } from "next-intl";
import type { Cart } from "@/types/commerce";
import { formatMoney } from "@/lib/commerce/utils/format";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

type Props = {
  cart: Cart;
  disabled?: boolean;
  onCheckout: () => void | Promise<void>;
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
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted text-sm tracking-[0.12em] uppercase">
          {labels.subtotal}
        </span>
        <span className="font-navigation text-text-black text-2xl">
          {formatMoney(cart.cost.subtotalAmount, locale)}
        </span>
      </div>
      <div className="bg-border h-px" />
      <p className="text-muted text-xs leading-relaxed">{labels.taxesNote}</p>
      <Button
        type="button"
        className="h-12 w-full"
        disabled={disabled || cart.totalQuantity === 0}
        onClick={onCheckout}
      >
        {labels.checkout}
      </Button>
    </div>
  );
}
