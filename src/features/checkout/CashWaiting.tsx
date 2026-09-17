"use client";

import { useEffect, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Banknote, ClipboardList, Package2, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { IconAction } from "@/components/ui/IconAction";
import { localizePath, staffCashPath } from "@/config/navigation";
import type { CheckoutOrder } from "@/types/commerce";
import { startTransferPolling } from "./transfer-polling";
import { Body } from "@/components/typography/Body";
import { PageTitle } from "@/components/typography/PageTitle";
import { OrderReceiptFeedback } from "@/features/orders/OrderReceiptFeedback";

export function CashWaiting({
  title,
  body,
  notice,
  children,
  paymentStatus,
  reference,
  receivedAt,
}: {
  title: string;
  body: string;
  notice: string;
  children: ReactNode;
  paymentStatus: CheckoutOrder["paymentStatus"];
  reference?: string;
  receivedAt?: string | null;
}) {
  const t = useTranslations("checkout.cashWaiting");
  const stateText = useTranslations("orders.states");
  const actions = useTranslations("checkout.transferWaiting");
  const locale = useLocale();
  const router = useRouter();
  const [refreshing, startTransition] = useTransition();
  const canRefresh =
    paymentStatus === "pending" || paymentStatus === "unverified";
  useEffect(() => {
    if (!canRefresh || refreshing) return;
    let requested = false;
    return startTransferPolling({
      visibility: document,
      isRefreshing: () => requested,
      refresh: () => {
        requested = true;
        startTransition(() => router.refresh());
      },
    });
  }, [canRefresh, refreshing, router]);
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Banknote
          aria-hidden
          className="text-text-accent mt-1 size-10 shrink-0"
          strokeWidth={1.5}
        />
        <div className="space-y-2" role="status" aria-live="polite">
          <PageTitle as="h1" className="text-4xl sm:text-5xl">
            {paymentStatus === "pending" ? title : stateText(paymentStatus)}
          </PageTitle>
          {paymentStatus === "pending" ? (
            <p className="text-text-accent">{stateText(paymentStatus)}</p>
          ) : null}
          <Body className="text-text-primary">
            {paymentStatus === "pending" ? body : t(`${paymentStatus}Body`)}
          </Body>
        </div>
      </div>
      <Card>
        <CardContent>
          <dl className="space-y-3">{children}</dl>
        </CardContent>
      </Card>
      {paymentStatus === "pending" ? (
        <p className="bg-warm text-text-secondary flex gap-3 rounded-xl p-4 text-sm">
          <ShieldCheck
            aria-hidden
            className="size-5 shrink-0"
            strokeWidth={1.5}
          />
          <span>{notice}</span>
        </p>
      ) : null}
      <div className="border-border flex flex-wrap justify-center gap-6 border-t pt-5">
        {canRefresh ? (
          <IconAction
            icon={<ClipboardList className="size-6" strokeWidth={1.5} />}
            loading={refreshing}
            disabled={refreshing}
            onClick={() => startTransition(() => router.refresh())}
          >
            {actions("check")}
          </IconAction>
        ) : null}
        <IconAction
          icon={<Package2 className="size-6" strokeWidth={1.5} />}
          href={localizePath(locale, "/orders")}
        >
          {actions("myOrders")}
        </IconAction>

        {canRefresh && reference ? (
          <IconAction
            icon={<Banknote className="size-6" strokeWidth={1.5} />}
            href={localizePath(
              locale,
              `${staffCashPath}?order=${encodeURIComponent(reference)}`,
            )}
          >
            {t("confirmPayment")}
          </IconAction>
        ) : null}
      </div>
      {paymentStatus === "approved" && reference && !receivedAt ? (
        <OrderReceiptFeedback reference={reference} />
      ) : null}
    </div>
  );
}
