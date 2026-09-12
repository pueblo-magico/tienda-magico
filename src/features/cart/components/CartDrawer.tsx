"use client";

import { useLocale, useTranslations } from "next-intl";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { localizePath } from "@/config/navigation";
import { useCart } from "../CartProvider";
import { CartLineItem } from "./CartLineItem";
import { CartSummary } from "./CartSummary";

export function CartDrawer() {
  const t = useTranslations("cart");
  const locale = useLocale();
  const {
    cart,
    isOpen,
    closeCart,
    isLoading,
    isMutating,
    error,
    updateItemQuantity,
    removeItem,
    checkout,
    setFulfillmentMode,
    configured,
  } = useCart();

  const busy = isLoading || isMutating;
  const hasLines = cart.lines.length > 0;

  return (
    <Drawer
      open={isOpen}
      onClose={closeCart}
      title={t("title")}
      titleId="cart-drawer-title"
      side="right"
      footer={
        hasLines ? (
          <div className="space-y-3">
            <CartSummary
              cart={cart}
              disabled={busy}
              fulfillmentDisabled={isLoading}
              onCheckout={checkout}
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
              }}
            />
            <Button
              href={localizePath(locale, "/cart")}
              variant="ghost"
              className="w-full"
              onClick={closeCart}
            >
              {t("viewCart")}
            </Button>
          </div>
        ) : undefined
      }
    >
      {!configured ? (
        <p className="text-muted mb-3 text-sm">{t("notConfigured")}</p>
      ) : null}

      {error ? (
        <p className="border-clay/30 bg-clay/10 text-forest mb-3 rounded-lg border px-3 py-2 text-sm">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="text-muted text-sm">{t("loading")}</p>
      ) : !hasLines ? (
        <div className="space-y-4 py-6">
          <p className="text-muted text-sm">{t("empty")}</p>
          <Button
            href={localizePath(locale, "/shop")}
            variant="secondary"
            onClick={closeCart}
          >
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
    </Drawer>
  );
}
