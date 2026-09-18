"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { localizePath } from "@/config/navigation";
import { Body, PageTitle } from "@/components/typography";
import { Button } from "@/components/ui/Button";
import { IconAction } from "@/components/ui/IconAction";
import { Card, CardContent } from "@/components/ui/Card";
import { ArrowRight, ClipboardList, Package2, Sprout } from "lucide-react";
import { getTransferWaitingState } from "@/lib/checkout/transfer-waiting";
import type { CheckoutOrder } from "@/types/commerce";
import { startTransferPolling } from "./transfer-polling";
import { OrderReceiptFeedback } from "@/features/orders/OrderReceiptFeedback";

type Props = {
  paymentStatus: CheckoutOrder["paymentStatus"];
  expiresAt: string | null;
  instructions: ReactNode;
  serverTime: number;
  reference: string;
  receivedAt?: string | null;
  canReport: boolean;
  reportedAt?: string | null;
  newerReference?: string;
  children: ReactNode;
};

export function TransferWaiting({
  paymentStatus,
  expiresAt,
  instructions,
  serverTime,
  reference,
  receivedAt,
  canReport,
  reportedAt,
  newerReference,
  children,
}: Props) {
  const t = useTranslations("checkout.transferWaiting");
  const locale = useLocale();
  const [alreadyTransferred, setAlreadyTransferred] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportFailed, setReportFailed] = useState(false);
  const hasReported = Boolean(reportedAt) || alreadyTransferred;
  const router = useRouter();
  const [now, setNow] = useState(serverTime);
  const [refreshing, startTransition] = useTransition();
  const state = getTransferWaitingState(paymentStatus, expiresAt, now);
  const canRefresh =
    state.status === "pending" ||
    state.status === "expired" ||
    state.status === "unverified";

  useEffect(() => {
    if (!state.canPay) return;
    const startedAt = performance.now();
    const timer = window.setInterval(() => {
      setNow(serverTime + performance.now() - startedAt);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [serverTime, state.canPay]);

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
      <div className="space-y-4" role="status" aria-live="polite">
        <PageTitle as="h1">
          {t.rich(`${state.status}.title`, {
            highlight: (chunks) => (
              <span className="text-text-highlight">{chunks}</span>
            ),
          })}
        </PageTitle>
        <Body>{t(`${state.status}.body`)}</Body>
      </div>
      {state.canPay ? (
        <>
          <p className="text-text-primary text-lg font-bold" role="timer">
            {t("remaining", {
              minutes: Math.floor(state.remainingSeconds / 60),
              seconds: state.remainingSeconds % 60,
            })}
          </p>
        </>
      ) : null}
      <Card>
        <CardContent>
          <dl className="text-text-primary space-y-3 text-left text-sm">
            {state.canPay && !hasReported && !newerReference
              ? instructions
              : null}
            {children}
          </dl>
        </CardContent>
      </Card>
      {newerReference ? (
        <p className="text-text-secondary" role="status">
          {t("newerAttempt")}
        </p>
      ) : null}
      {state.status === "expired" ||
      state.status === "pending" ||
      state.status === "unverified" ||
      state.status === "rejected" ||
      state.status === "cancelled" ? (
        <div className="space-y-3">
          {!hasReported &&
          ["expired", "rejected", "cancelled"].includes(state.status) ? (
            <>
              <div className="bg-warm flex items-center gap-4 rounded-xl p-5">
                <Sprout
                  aria-hidden
                  className="text-text-accent size-8 shrink-0"
                  strokeWidth={1.5}
                />
                <Body size="sm">{t("retryHint")}</Body>
              </div>
              <Button className="w-full" href={localizePath(locale, "/cart")}>
                {t("retry")}
                <ArrowRight aria-hidden className="size-5" strokeWidth={2} />
              </Button>
            </>
          ) : null}
          {canRefresh && canReport ? (
            <Button
              variant="secondary"
              className="w-full"
              disabled={refreshing || hasReported || reporting}
              onClick={async () => {
                setReporting(true);
                setReportFailed(false);
                try {
                  const result = await fetch("/api/orders", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reference }),
                  });
                  if (!result.ok) throw new Error();
                  setAlreadyTransferred(true);
                  startTransition(() => router.refresh());
                } catch {
                  setReportFailed(true);
                } finally {
                  setReporting(false);
                }
              }}
            >
              {t("alreadyTransferred")}
            </Button>
          ) : null}
          {hasReported ? (
            <p className="text-text-secondary text-sm" role="status">
              {t("verificationHint")}
            </p>
          ) : null}
          {reportFailed ? <p role="alert">{t("reportFailed")}</p> : null}
        </div>
      ) : null}
      <div className="border-border flex flex-wrap items-center justify-center gap-4 border-t pt-6">
        {canRefresh ? (
          <IconAction
            icon={<ClipboardList className="size-6" strokeWidth={1.5} />}
            loading={refreshing}
            disabled={refreshing}
            onClick={() => startTransition(() => router.refresh())}
          >
            {t("check")}
          </IconAction>
        ) : null}
        <IconAction
          href={localizePath(locale, "/orders")}
          icon={<Package2 className="size-6" strokeWidth={1.5} />}
        >
          {t("myOrders")}
        </IconAction>
      </div>
      {state.status === "approved" && !receivedAt ? (
        <OrderReceiptFeedback reference={reference} />
      ) : null}
    </div>
  );
}
