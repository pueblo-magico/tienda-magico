"use client";

import { Tabs } from "@/components/ui/Tabs";
import { useLocale, useTranslations } from "next-intl";
import { ChevronRight, Circle, Package2 } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { formatMoney } from "@/lib/commerce/utils/format";
import type { CheckoutOrder } from "@/types/commerce";
import {
  filterOrders,
  orderDisplayState,
  type OrderFilter,
} from "./presentation";
import { OrderReceiptFeedback } from "./OrderReceiptFeedback";
import { OrderReceiptPrompt } from "./OrderReceiptPrompt";
import { localizePath } from "@/config/navigation";

export function OrderList({
  orders,
  serverTime,
  historyScope = "browser",
}: {
  orders: CheckoutOrder[];
  serverTime: number;
  historyScope?: "browser" | "account";
}) {
  const t = useTranslations("orders");
  const locale = useLocale();
  const filters: OrderFilter[] = [
    "all",
    "pending",
    "reported",
    "approved",
    "expired",
    "rejected",
    "cancelled",
    "unverified",
  ];
  const items = filters
    .filter(
      (value) =>
        ["all", "pending", "approved"].includes(value) ||
        orders.some((order) => orderDisplayState(order, serverTime) === value),
    )
    .map((value) => {
      const visible = filterOrders(orders, value, serverTime);
      return {
        id: value,
        label: value === "all" ? t("all") : t(`states.${value}`),
        content: (
          <>
            {!visible.length ? (
              <p className="text-text-primary py-6" role="status">
                {t(
                  orders.length
                    ? "noMatches"
                    : historyScope === "account"
                      ? "emptyAccount"
                      : "empty",
                )}
              </p>
            ) : null}
            <ul className="space-y-4">
              {visible.map((order) => {
                const state = orderDisplayState(order, serverTime);
                const query = new URLSearchParams({
                  payment_method: order.paymentMethod,
                  order: order.publicReference,
                  from: "orders",
                });
                return (
                  <li key={order.publicReference}>
                    <Card>
                      <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-center">
                        <div
                          aria-hidden
                          className="bg-warm text-text-secondary hidden size-24 shrink-0 items-center justify-center rounded-lg sm:flex"
                        >
                          <Package2 className="size-10" strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                          <CardTitle className="inline-flex items-center gap-2">
                            {t(`states.${state}`)}{" "}
                            <Circle
                              aria-hidden
                              strokeWidth={0}
                              className="size-3"
                              fill={
                                state === "approved"
                                  ? "var(--text-secondary)"
                                  : state === "pending"
                                    ? "var(--text-highlight)"
                                    : "var(--terracotta)"
                              }
                            />{" "}
                          </CardTitle>
                          <div className="text-text-primary flex items-center gap-1 text-xs">
                            <span className="break-all">
                              {t("reference", {
                                reference: order.publicReference,
                              })}
                            </span>

                            <CopyButton
                              value={order.publicReference}
                              label={t("copy")}
                              copiedLabel={t("copied")}
                              errorLabel={t("copyFailed")}
                            />
                          </div>
                          <p className="text-text-black text-lg">
                            {formatMoney(order.total, locale)}
                          </p>
                          {order.newerReference ? (
                            <p className="text-text-secondary text-sm break-words">
                              {t("newer", { reference: order.newerReference })}
                            </p>
                          ) : null}
                          {order.paymentExpiresAt ? (
                            <p className="text-text-primary text-sm">
                              {t("deadline", {
                                date: new Date(
                                  order.paymentExpiresAt,
                                ).toLocaleString(locale),
                              })}
                            </p>
                          ) : null}
                        </div>
                        {["bank-transfer", "cash"].includes(
                          order.paymentMethod,
                        ) ? (
                          <Button
                            href={localizePath(
                              locale,
                              `/checkout/pending?${query}`,
                            )}
                            size="sm"
                            className="shrink-0"
                          >
                            {t("view")}
                            <ChevronRight
                              aria-hidden
                              className="size-4"
                              strokeWidth={2}
                            />
                          </Button>
                        ) : null}
                      </CardContent>
                    </Card>
                    {order.paymentStatus === "approved" ? (
                      <>
                        <OrderReceiptPrompt order={order} />
                        {order.experienceRating == null ? (
                          <OrderReceiptFeedback
                            reference={order.publicReference}
                            layout="wide"
                            feedbackOnly
                          />
                        ) : null}
                      </>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </>
        ),
      };
    });
  return <Tabs items={items} label={t("filterLabel")} />;
}
