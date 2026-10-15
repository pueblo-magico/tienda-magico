"use client";

import { useId } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowRight,
  CreditCard,
  FileText,
  Info,
  Sprout,
  Truck,
  UserRound,
} from "lucide-react";
import { Accordion } from "@pueblo-magico/react-ui";
import { Input, Select } from "@pueblo-magico/react-ui";
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
import { Button } from "@pueblo-magico/react-ui";
import { cn } from "@/lib/utils/cn";
import {
  isBankTransferAvailable,
  type CommerceSettings,
} from "@/lib/commerce/commerce-settings";
import {
  BANK_TRANSFER,
  CASH,
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
    cash: string;
    cashHint: string;
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
    <div className={cn("space-y-3", className)}>
      <div className="flex items-start justify-between gap-4 px-2 pb-2">
        <div>
          <h2 className="text-text-secondary font-serif text-3xl">
            {t("summary")}
          </h2>
          <p className="text-text-primary mt-2 text-base">{t("summaryHint")}</p>
        </div>
        <Sprout
          aria-hidden
          strokeWidth={1.5}
          className="text-text-accent mt-1 size-12 shrink-0"
        />
      </div>
      <div className="bg-warm text-text-secondary flex flex-wrap items-center justify-between gap-3 rounded-xl px-5 py-3">
        <span className="text-lg">{labels.subtotal}</span>
        <span className="text-3xl font-bold">
          {formatMoney(cart.cost.subtotalAmount, locale)}
        </span>
      </div>
      <p className="text-text-primary px-2 pb-2 text-sm">{labels.taxesNote}</p>
      <Accordion
        defaultExpandedItems={["buyer"]}
        items={[
          {
            id: "buyer",
            header: (
              <>
                <UserRound aria-hidden strokeWidth={1.5} className="size-6" />
                <span>{labels.buyerLegend}</span>
              </>
            ),
            content: (
              <>
                <fieldset className="space-y-3">
                  <legend className="sr-only">{labels.buyerLegend}</legend>
                  <Input
                    name={`${paymentGroupName}-buyer-name`}
                    autoComplete="name"
                    placeholder={t("buyerNamePlaceholder")}
                    label={labels.buyerName}
                    value={buyerName}
                    onChange={onBuyerNameChange}
                    isRequired
                  />
                  <Input
                    name={`${paymentGroupName}-buyer-email`}
                    type="email"
                    autoComplete="email"
                    placeholder={t("buyerEmailPlaceholder")}
                    label={labels.buyerEmail}
                    value={buyerEmail}
                    onChange={onBuyerEmailChange}
                    isRequired
                  />
                </fieldset>
                {!hasBuyerDetails ? (
                  <p className="text-clay text-xs" role="status">
                    {labels.buyerRequired}
                  </p>
                ) : null}
              </>
            ),
          },
        ]}
      />
      <Accordion
        defaultExpandedItems={["fulfillment"]}
        items={[
          {
            id: "fulfillment",
            header: (
              <>
                <Truck aria-hidden strokeWidth={1.5} className="size-6" />
                <span>{labels.fulfillmentLegend}</span>
              </>
            ),
            content: (
              <>
                <fieldset className="space-y-3">
                  <legend className="sr-only">
                    {labels.fulfillmentLegend}
                  </legend>
                  {commerceSettings.localCollectionEnabled ? (
                    <label className="flex cursor-pointer items-start gap-4 py-1">
                      <input
                        type="radio"
                        className="accent-forest focus-visible:outline-forest mt-1 size-5 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        name={fulfillmentGroupName}
                        value={LOCAL_COLLECTION}
                        checked={cart.fulfillmentMode === LOCAL_COLLECTION}
                        disabled={fulfillmentDisabled}
                        onChange={() =>
                          void onFulfillmentModeChange(LOCAL_COLLECTION)
                        }
                      />
                      <span className="space-y-1">
                        <span className="text-text-secondary block text-base">
                          {labels.localCollection}
                        </span>
                        <span className="text-text-primary block text-sm">
                          {labels.localCollectionHint}
                        </span>
                      </span>
                    </label>
                  ) : null}
                  {commerceSettings.deliveryEnabled ? (
                    <label className="flex cursor-pointer items-start gap-4 py-1">
                      <input
                        type="radio"
                        className="accent-forest focus-visible:outline-forest mt-1 size-5 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        name={fulfillmentGroupName}
                        value={DELIVERY}
                        checked={cart.fulfillmentMode === DELIVERY}
                        disabled={fulfillmentDisabled}
                        onChange={() => void onFulfillmentModeChange(DELIVERY)}
                      />
                      <span className="space-y-1">
                        <span className="text-text-secondary block text-base">
                          {labels.delivery}
                        </span>
                        <span className="text-text-primary block text-sm">
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
              </>
            ),
          },
        ]}
      />
      <Accordion
        defaultExpandedItems={["payment"]}
        items={[
          {
            id: "payment",
            header: (
              <>
                <CreditCard aria-hidden strokeWidth={1.5} className="size-6" />
                <span>{labels.paymentLegend}</span>
              </>
            ),
            content: (
              <fieldset className="space-y-3">
                <legend className="sr-only">{labels.paymentLegend}</legend>
                <label className="flex cursor-pointer items-start gap-4 py-1">
                  <input
                    type="radio"
                    className="accent-forest focus-visible:outline-forest mt-1 size-5 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    name={paymentGroupName}
                    value={MERCADO_PAGO}
                    checked={paymentMethod === MERCADO_PAGO}
                    disabled={fulfillmentDisabled}
                    onChange={() => onPaymentMethodChange(MERCADO_PAGO)}
                  />
                  <span className="space-y-1">
                    <span className="text-text-secondary block text-base">
                      {labels.mercadoPago}
                    </span>
                    <span className="text-text-primary block text-sm">
                      {labels.mercadoPagoHint}
                    </span>
                  </span>
                </label>
                {isBankTransferAvailable(commerceSettings) ? (
                  <label className="flex cursor-pointer items-start gap-4 py-1">
                    <input
                      type="radio"
                      className="accent-forest focus-visible:outline-forest mt-1 size-5 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      name={paymentGroupName}
                      value={BANK_TRANSFER}
                      checked={paymentMethod === BANK_TRANSFER}
                      disabled={fulfillmentDisabled}
                      onChange={() => onPaymentMethodChange(BANK_TRANSFER)}
                    />
                    <span className="space-y-1">
                      <span className="text-text-secondary block text-base">
                        {labels.bankTransfer}
                      </span>
                      <span className="text-text-primary block text-sm">
                        {labels.bankTransferHint}
                      </span>
                    </span>
                  </label>
                ) : null}
                {commerceSettings.cashEnabled &&
                cart.fulfillmentMode === LOCAL_COLLECTION ? (
                  <label className="flex cursor-pointer items-start gap-4 py-1">
                    <input
                      type="radio"
                      className="accent-forest focus-visible:outline-forest mt-1 size-5 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      name={paymentGroupName}
                      value={CASH}
                      checked={paymentMethod === CASH}
                      disabled={fulfillmentDisabled}
                      onChange={() => onPaymentMethodChange(CASH)}
                    />
                    <span className="space-y-1">
                      <span className="text-text-secondary block text-base">
                        {labels.cash}
                      </span>
                      <span className="text-text-primary block text-sm">
                        {labels.cashHint}
                      </span>
                    </span>
                  </label>
                ) : null}
              </fieldset>
            ),
          },
        ]}
      />
      {paymentMethod === BANK_TRANSFER ? (
        <Accordion
          defaultExpandedItems={["identification"]}
          items={[
            {
              id: "identification",
              header: (
                <>
                  <FileText aria-hidden strokeWidth={1.5} className="size-6" />
                  <span>{t("transferDetails")}</span>
                </>
              ),
              content: (
                <fieldset className="space-y-3" disabled={disabled}>
                  <legend className="sr-only">
                    {t("senderIdentification")}
                  </legend>
                  <Select
                    name={`${paymentGroupName}-identification-type`}
                    label={t("identificationType")}
                    placeholder={t("identificationType")}
                    value={identification.type}
                    options={IDENTIFICATION_TYPES.map((type) => ({
                      value: type,
                      label: type,
                    }))}
                    onChange={(value) => {
                      if (!value) return;
                      onIdentificationChange({
                        ...identification,
                        type: value as TransferIdentification["type"],
                      });
                    }}
                    aria-describedby={identificationHintId}
                    isRequired
                  />
                  <Input
                    name={`${paymentGroupName}-identification-number`}
                    label={t("identificationNumber")}
                    placeholder={t("identificationPlaceholder")}
                    value={identification.number}
                    onChange={(value) =>
                      onIdentificationChange({
                        ...identification,
                        number: value,
                      })
                    }
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={32}
                    aria-describedby={identificationHintId}
                    isRequired
                  />
                  <p
                    id={identificationHintId}
                    className="bg-warm text-text-secondary flex items-center gap-3 rounded-xl p-4 text-sm"
                  >
                    <Info
                      aria-hidden
                      strokeWidth={1.5}
                      className="size-6 shrink-0"
                    />
                    <span>{t("identificationHint")}</span>
                  </p>
                </fieldset>
              ),
            },
          ]}
        />
      ) : null}
      <Button
        type="button"
        className="w-full gap-3"
        size="lg"
        isLoading={disabled}
        isDisabled={
          disabled ||
          cart.totalQuantity === 0 ||
          !hasEnabledFulfillmentMode ||
          !hasBuyerDetails ||
          (paymentMethod === CASH &&
            cart.fulfillmentMode !== LOCAL_COLLECTION) ||
          (paymentMethod === BANK_TRANSFER &&
            !normalizeTransferIdentification(identification))
        }
        onClick={onCheckout}
      >
        {t("reviewPurchase")}
        <ArrowRight aria-hidden strokeWidth={2} className="size-5" />
      </Button>
    </div>
  );
}
