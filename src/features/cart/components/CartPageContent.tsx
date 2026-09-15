"use client";

import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { LockKeyhole, Sprout, Truck } from "lucide-react";
import { localizePath } from "@/config/navigation";
import { Body, PageTitle } from "@/components/typography";
import { useCart } from "../CartProvider";
import { CartLineItem } from "./CartLineItem";
import { CartSummary } from "./CartSummary";

export function CartPageContent() {
  const t = useTranslations("cart");
  const locale = useLocale();
  const {
    cart,
    isLoading,
    isMutating,
    error,
    configured,
    updateItemQuantity,
    removeItem,
    checkout,
    setFulfillmentMode,
    commerceSettings,
    paymentMethod,
    setPaymentMethod,
  } = useCart();

  const busy = isLoading || isMutating;

  return (
    <div className="space-y-8">
      <div className="border-border flex items-end justify-between border-b pb-5">
        <div>
          <p className="text-text-accent mb-2 text-xs font-medium tracking-[0.16em] uppercase">
            Pueblo Mágico
          </p>
          <PageTitle as="h1" className="text-4xl sm:text-5xl">
            {t("title")}
          </PageTitle>
        </div>
        {cart.totalQuantity > 0 ? (
          <p className="text-muted text-sm">
            {cart.totalQuantity}{" "}
            {cart.totalQuantity === 1 ? t("item") : t("items")}
          </p>
        ) : null}
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          {!configured ? (
            <Body className="text-muted">{t("notConfigured")}</Body>
          ) : null}

          {error ? (
            <p className="border-clay/30 bg-clay/10 rounded-lg border px-3 py-2 text-sm">
              {error}
            </p>
          ) : null}

          {isLoading ? (
            <Body className="text-muted">{t("loading")}</Body>
          ) : cart.lines.length === 0 ? (
            <div className="space-y-4">
              <Body>{t("empty")}</Body>
              <Button href={localizePath(locale, "/shop")} variant="secondary">
                {t("continue")}
              </Button>
            </div>
          ) : (
            <ul className="divide-border border-border bg-card divide-y rounded-2xl border px-4 sm:px-6">
              {cart.lines.map((line) => (
                <li key={line.id}>
                  <CartLineItem
                    line={line}
                    disabled={busy}
                    onQuantityChange={(lineId, quantity) => {
                      void updateItemQuantity(lineId, quantity);
                    }}
                    onRemove={(lineId) => {
                      void removeItem(lineId);
                    }}
                    labels={{
                      remove: t("remove"),
                      quantity: t("quantity"),
                      decrease: t("decrease"),
                      increase: t("increase"),
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {cart.lines.length > 0 ? (
          <aside className="border-border bg-warm h-fit rounded-2xl border p-6 lg:sticky lg:top-28">
            <h2 className="font-navigation text-text-black mb-5 text-2xl">
              {t("summary")}
            </h2>
            <CartSummary
              cart={cart}
              commerceSettings={commerceSettings}
              disabled={busy}
              fulfillmentDisabled={isLoading}
              onCheckout={checkout}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
              onFulfillmentModeChange={setFulfillmentMode}
              labels={{
                subtotal: t("subtotal"),
                checkout: t("checkout"),
                taxesNote: t("taxesNote"),
                fulfillmentLegend: t("fulfillmentLegend"),
                localCollection: t("localCollection"),
                localCollectionHint: t("localCollectionHint"),
                delivery: t("delivery"),
                deliveryHint: t("deliveryHint"),
                fulfillmentRequired: t("fulfillmentRequired"),
                paymentLegend: t("paymentLegend"),
                mercadoPago: t("mercadoPago"),
                mercadoPagoHint: t("mercadoPagoHint"),
                bankTransfer: t("bankTransfer"),
                bankTransferHint: t("bankTransferHint", {
                  minutes: commerceSettings.transfer.paymentWindowMinutes,
                }),
              }}
            />
            <div className="mt-3">
              <Button
                href={localizePath(locale, "/shop")}
                variant="ghost"
                className="w-full"
              >
                {t("continue")}
              </Button>
            </div>
          </aside>
        ) : null}
      </div>
      {cart.lines.length > 0 ? (
        <div className="border-border text-muted grid gap-4 border-t pt-6 text-center text-xs sm:grid-cols-3">
          <p>
            <Truck aria-hidden className="mx-auto size-4" strokeWidth={1.5} />
            <strong className="text-text-black block">
              {t("shippingBenefit")}
            </strong>
          </p>
          <p>
            <Sprout aria-hidden className="mx-auto size-4" strokeWidth={1.5} />
            <strong className="text-text-black block">
              {t("sourcingBenefit")}
            </strong>
          </p>
          <p>
            <LockKeyhole
              aria-hidden
              className="mx-auto size-4"
              strokeWidth={1.5}
            />
            <strong className="text-text-black block">
              {t("paymentBenefit")}
            </strong>
          </p>
        </div>
      ) : null}
    </div>
  );
}
