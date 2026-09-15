"use client";

import { useId } from "react";
import { useLocale } from "next-intl";
import type { Cart } from "@/types/commerce";
import {
  DELIVERY,
  LOCAL_COLLECTION,
  type FulfillmentMode,
} from "@/lib/commerce/local-purchase";
import { formatMoney } from "@/lib/commerce/utils/format";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import {
  isBankTransferAvailable,
  type CommerceSettings,
} from "@/lib/commerce/commerce-settings";
import {
  BANK_TRANSFER,
  MERCADO_PAGO,
  type PaymentMethod,
} from "@/types/checkout";

type Props = {
  cart: Cart;
  commerceSettings: CommerceSettings;
  disabled?: boolean;
  fulfillmentDisabled?: boolean;
  onCheckout: () => void | Promise<void>;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  labels: {
    subtotal: string;
    checkout: string;
    taxesNote: string;
    fulfillmentLegend: string;
    localCollection: string;
    localCollectionHint: string;
    delivery: string;
    deliveryHint: string;
    fulfillmentRequired: string;
    paymentLegend: string;
    mercadoPago: string;
    mercadoPagoHint: string;
    bankTransfer: string;
    bankTransferHint: string;
  };
  onFulfillmentModeChange: (mode: FulfillmentMode) => void | Promise<void>;
  className?: string;
};

export function CartSummary({
  cart,
  commerceSettings,
  disabled,
  fulfillmentDisabled,
  onCheckout,
  paymentMethod,
  onPaymentMethodChange,
  labels,
  onFulfillmentModeChange,
  className,
}: Props) {
  const locale = useLocale();
  const fulfillmentGroupName = `fulfillment-mode-${useId()}`;
  const paymentGroupName = `payment-method-${useId()}`;
  const hasEnabledFulfillmentMode =
    (cart.fulfillmentMode === LOCAL_COLLECTION &&
      commerceSettings.localCollectionEnabled) ||
    (cart.fulfillmentMode === DELIVERY && commerceSettings.deliveryEnabled);

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
      <fieldset className="space-y-3">
        <legend className="text-text-black text-sm font-semibold">
          {labels.fulfillmentLegend}
        </legend>
        {commerceSettings.localCollectionEnabled ? (
          <label className="border-border flex cursor-pointer gap-3 rounded-lg border p-3">
            <input
              type="radio"
              name={fulfillmentGroupName}
              value={LOCAL_COLLECTION}
              checked={cart.fulfillmentMode === LOCAL_COLLECTION}
              disabled={fulfillmentDisabled}
              onChange={() => void onFulfillmentModeChange(LOCAL_COLLECTION)}
            />
            <span className="space-y-1">
              <span className="text-text-black block text-sm font-medium">
                {labels.localCollection}
              </span>
              <span className="text-muted block text-xs">
                {labels.localCollectionHint}
              </span>
            </span>
          </label>
        ) : null}
        {commerceSettings.deliveryEnabled ? (
          <label className="border-border flex cursor-pointer gap-3 rounded-lg border p-3">
            <input
              type="radio"
              name={fulfillmentGroupName}
              value={DELIVERY}
              checked={cart.fulfillmentMode === DELIVERY}
              disabled={fulfillmentDisabled}
              onChange={() => void onFulfillmentModeChange(DELIVERY)}
            />
            <span className="space-y-1">
              <span className="text-text-black block text-sm font-medium">
                {labels.delivery}
              </span>
              <span className="text-muted block text-xs">
                {labels.deliveryHint}
              </span>
            </span>
          </label>
        ) : null}
      </fieldset>
      {!hasEnabledFulfillmentMode ? (
        <p className="text-clay text-xs" role="status">
          {labels.fulfillmentRequired}
        </p>
      ) : null}
      <fieldset className="space-y-3">
        <legend className="text-text-black text-sm font-semibold">
          {labels.paymentLegend}
        </legend>
        <label className="border-border flex cursor-pointer gap-3 rounded-lg border p-3">
          <input
            type="radio"
            name={paymentGroupName}
            value={MERCADO_PAGO}
            checked={paymentMethod === MERCADO_PAGO}
            disabled={fulfillmentDisabled}
            onChange={() => onPaymentMethodChange(MERCADO_PAGO)}
          />
          <span className="space-y-1">
            <span className="text-text-black block text-sm font-medium">
              {labels.mercadoPago}
            </span>
            <span className="text-muted block text-xs">
              {labels.mercadoPagoHint}
            </span>
          </span>
        </label>
        {isBankTransferAvailable(commerceSettings) ? (
          <label className="border-border flex cursor-pointer gap-3 rounded-lg border p-3">
            <input
              type="radio"
              name={paymentGroupName}
              value={BANK_TRANSFER}
              checked={paymentMethod === BANK_TRANSFER}
              disabled={fulfillmentDisabled}
              onChange={() => onPaymentMethodChange(BANK_TRANSFER)}
            />
            <span className="space-y-1">
              <span className="text-text-black block text-sm font-medium">
                {labels.bankTransfer}
              </span>
              <span className="text-muted block text-xs">
                {labels.bankTransferHint}
              </span>
            </span>
          </label>
        ) : null}
      </fieldset>
      <p className="text-muted text-xs leading-relaxed">{labels.taxesNote}</p>
      <Button
        type="button"
        className="h-12 w-full"
        disabled={
          disabled || cart.totalQuantity === 0 || !hasEnabledFulfillmentMode
        }
        onClick={onCheckout}
      >
        {labels.checkout}
      </Button>
    </div>
  );
}
