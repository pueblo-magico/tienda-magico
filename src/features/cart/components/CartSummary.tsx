"use client";

import { useId } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Select } from "@/components/ui/Select";
import {
  IDENTIFICATION_TYPES,
  normalizeTransferIdentification,
  type TransferIdentification,
} from "@/lib/checkout/transfer-identification";
import type { Cart } from "@/types/commerce";
import {
  DELIVERY,
  LOCAL_COLLECTION,
  type FulfillmentMode,
} from "@/lib/commerce/local-purchase";
import { formatMoney } from "@/lib/commerce/utils/format";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
  buyerName: string;
  buyerEmail: string;
  identification: TransferIdentification;
  onIdentificationChange: (value: TransferIdentification) => void;
  onBuyerNameChange: (name: string) => void;
  onBuyerEmailChange: (email: string) => void;
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
    buyerLegend: string;
    buyerName: string;
    buyerEmail: string;
    buyerRequired: string;
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
  buyerName,
  buyerEmail,
  identification,
  onIdentificationChange,
  onBuyerNameChange,
  onBuyerEmailChange,
  onPaymentMethodChange,
  labels,
  onFulfillmentModeChange,
  className,
}: Props) {
  const locale = useLocale();
  const t = useTranslations("cart");
  const identificationHintId = useId();
  const fulfillmentGroupName = `fulfillment-mode-${useId()}`;
  const paymentGroupName = `payment-method-${useId()}`;
  const hasEnabledFulfillmentMode =
    (cart.fulfillmentMode === LOCAL_COLLECTION &&
      commerceSettings.localCollectionEnabled) ||
    (cart.fulfillmentMode === DELIVERY && commerceSettings.deliveryEnabled);
  const hasBuyerDetails =
    buyerName.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail.trim());

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
          {labels.buyerLegend}
        </legend>
        <Input
          name={`${paymentGroupName}-buyer-name`}
          autoComplete="name"
          label={labels.buyerName}
          value={buyerName}
          onChange={(event) => onBuyerNameChange(event.target.value)}
          required
        />
        <Input
          name={`${paymentGroupName}-buyer-email`}
          type="email"
          autoComplete="email"
          label={labels.buyerEmail}
          value={buyerEmail}
          onChange={(event) => onBuyerEmailChange(event.target.value)}
          required
        />
      </fieldset>
      {!hasBuyerDetails ? (
        <p className="text-clay text-xs" role="status">
          {labels.buyerRequired}
        </p>
      ) : null}
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
      {paymentMethod === BANK_TRANSFER ? (
        <fieldset className="space-y-3" disabled={disabled}>
          <legend className="text-text-black text-sm font-semibold">
            {t("senderIdentification")}
          </legend>
          <Select
            name={`${paymentGroupName}-identification-type`}
            label={t("identificationType")}
            value={identification.type}
            options={IDENTIFICATION_TYPES.map((type) => ({
              value: type,
              label: type,
            }))}
            onChange={(event) =>
              onIdentificationChange({
                ...identification,
                type: event.target.value,
              })
            }
            aria-describedby={identificationHintId}
            required
          />
          <Input
            name={`${paymentGroupName}-identification-number`}
            label={t("identificationNumber")}
            value={identification.number}
            onChange={(event) =>
              onIdentificationChange({
                ...identification,
                number: event.target.value,
              })
            }
            inputMode="numeric"
            autoComplete="off"
            maxLength={32}
            aria-describedby={identificationHintId}
            required
          />
          <p id={identificationHintId} className="text-text-secondary text-sm">
            {t("identificationHint")}
          </p>
        </fieldset>
      ) : null}
      <p className="text-muted text-xs leading-relaxed">{labels.taxesNote}</p>
      <Button
        type="button"
        className="h-12 w-full"
        disabled={
          disabled ||
          cart.totalQuantity === 0 ||
          !hasEnabledFulfillmentMode ||
          !hasBuyerDetails ||
          (paymentMethod === BANK_TRANSFER &&
            !normalizeTransferIdentification(identification))
        }
        onClick={onCheckout}
      >
        {labels.checkout}
      </Button>
    </div>
  );
}
