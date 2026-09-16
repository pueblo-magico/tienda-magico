"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { localizePath } from "@/config/navigation";
import { Body, PageTitle } from "@/components/typography";
import { Button } from "@/components/ui/Button";
import { getTransferWaitingState } from "@/lib/checkout/transfer-waiting";
import type { CheckoutOrder } from "@/types/commerce";
import { startTransferPolling } from "./transfer-polling";

type Props = {
  paymentStatus: CheckoutOrder["paymentStatus"];
  expiresAt: string | null;
  instructions: ReactNode;
  serverTime: number;
  reference: string;
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
        <PageTitle as="h1" className="text-4xl sm:text-5xl">
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
      <dl className="border-border bg-card text-text-primary mx-auto w-full max-w-md space-y-3 rounded-2xl border px-5 py-4 text-left text-sm">
        {state.canPay && !hasReported && !newerReference ? instructions : null}
        {children}
      </dl>
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
              <Body>{t("retryHint")}</Body>
              <Button href={localizePath(locale, "/cart")}>{t("retry")}</Button>
            </>
          ) : null}
          {canRefresh && canReport ? (
            <Button
              variant="secondary"
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
      {canRefresh ? (
        <Button
          variant="secondary"
          disabled={refreshing}
          onClick={() => startTransition(() => router.refresh())}
        >
          {t(refreshing ? "checking" : "check")}
        </Button>
      ) : null}
      <Button href={localizePath(locale, "/orders")} variant="ghost">
        {t("myOrders")}
      </Button>
    </div>
  );
}
