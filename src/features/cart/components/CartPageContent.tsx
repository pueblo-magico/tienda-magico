"use client";

import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
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
  } = useCart();

  const busy = isLoading || isMutating;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-4">
        <PageTitle as="h1" className="text-4xl sm:text-5xl">
          {t("title")}
        </PageTitle>

        {!configured ? (
          <Body className="text-muted">{t("notConfigured")}</Body>
        ) : null}

        {error ? (
          <p className="rounded-lg border border-clay/30 bg-clay/10 px-3 py-2 text-sm">
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
          <ul>
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
        <aside className="h-fit rounded-2xl border border-border bg-white/50 p-5">
          <CartSummary
            cart={cart}
            disabled={busy}
            onCheckout={checkout}
            labels={{
              subtotal: t("subtotal"),
              checkout: t("checkout"),
              taxesNote: t("taxesNote"),
            }}
          />
          <div className="mt-3">
            <Button href={localizePath(locale, "/shop")} variant="ghost" className="w-full">
              {t("continue")}
            </Button>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
