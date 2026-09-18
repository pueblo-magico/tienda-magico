"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Banknote,
  ClipboardList,
  Package2,
  ShieldCheck,
  Clock,
  FileText,
  Store,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StepsCard } from "@/components/cards/StepsCard";
import { Eyebrow } from "@/components/typography/Eyebrow";
import { IconAction } from "@/components/ui/IconAction";
import { localizePath, staffCashPath } from "@/config/navigation";
import type { CheckoutOrder } from "@/types/commerce";
import { startTransferPolling } from "./transfer-polling";
import { Body } from "@/components/typography/Body";
import { PageTitle } from "@/components/typography/PageTitle";
import { OrderReceiptFeedback } from "@/features/orders/OrderReceiptFeedback";
import { CashConfirmed } from "./CashConfirmed";

export function CashWaiting({
  title,
  body,
  notice,
  children,
  paymentStatus,
  reference,
  receivedAt,
  cashStaffEnabled = false,
  returnLink,
  summary,
  feedbackSubmitted,
  expiresAt,
  serverTime = 0,
}: {
  title: string;
  body: string;
  notice: string;
  children: ReactNode;
  paymentStatus: CheckoutOrder["paymentStatus"];
  reference?: string;
  receivedAt?: string | null;
  cashStaffEnabled?: boolean;
  returnLink?: ReactNode;
  summary?: ReactNode;
  feedbackSubmitted?: boolean;
  expiresAt?: string | null;
  serverTime?: number;
}) {
  const t = useTranslations("checkout.cashWaiting");
  const checkoutText = useTranslations("checkout");
  const stateText = useTranslations("orders.states");
  const actions = useTranslations("checkout.transferWaiting");
  const locale = useLocale();
  const router = useRouter();
  const [refreshing, startTransition] = useTransition();
  const [now, setNow] = useState(serverTime);
  const [cancelling, setCancelling] = useState(false);
  const [cancelFailed, setCancelFailed] = useState(false);
  const expired =
    paymentStatus === "pending" &&
    Boolean(expiresAt) &&
    Date.parse(expiresAt ?? "") <= now;
  useEffect(() => {
    if (paymentStatus !== "pending" || !expiresAt) return;
    const start = performance.now();
    const timer = window.setInterval(
      () => setNow(serverTime + performance.now() - start),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [paymentStatus, expiresAt, serverTime]);
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
  if (paymentStatus === "approved" && reference && summary) {
    return (
      <CashConfirmed
        feedbackSubmitted={feedbackSubmitted}
        summary={summary}
        reference={reference}
        receivedAt={receivedAt}
        returnLink={returnLink}
      />
    );
  }
  return (
    <div className="space-y-6">
      <nav aria-label={t("breadcrumbLabel")}>
        <ol className="text-text-primary flex flex-wrap items-center gap-3 text-sm">
          <li>
            <Link className="hover:underline" href={localizePath(locale, "/")}>
              {t("home")}
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="size-4" />
          </li>
          <li>
            <Link
              className="hover:underline"
              href={localizePath(locale, "/cart")}
            >
              {t("cart")}
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="size-4" />
          </li>
          <li aria-current="page" className="text-text-black">
            {checkoutText("eyebrow")}
          </li>
        </ol>
      </nav>
      <div className="flex items-start gap-4 sm:gap-8">
        <div className="bg-warm text-earth flex size-16 shrink-0 items-center justify-center rounded-full sm:size-24">
          <Banknote
            aria-hidden
            className="size-8 sm:size-12"
            strokeWidth={1.5}
          />
        </div>
        <div className="min-w-0 space-y-3" role="status" aria-live="polite">
          <Eyebrow>{checkoutText("eyebrow")}</Eyebrow>
          <PageTitle as="h1" className="text-3xl sm:text-4xl lg:text-5xl">
            {expired
              ? stateText("expired")
              : paymentStatus === "pending"
                ? title
                : stateText(paymentStatus)}
          </PageTitle>
          {paymentStatus === "pending" ? (
            <Badge
              variant="earth"
              className="gap-2 px-4 py-2 text-base font-normal tracking-normal normal-case"
            >
              <Clock aria-hidden className="size-5" />
              {stateText(expired ? "expired" : paymentStatus)}
            </Badge>
          ) : null}
          <Body className="text-text-primary max-w-3xl">
            {expired
              ? t("expiredBody")
              : paymentStatus === "pending"
                ? body
                : t(`${paymentStatus}Body`)}
          </Body>
          {expiresAt && paymentStatus === "pending" ? (
            <p className="text-text-secondary">
              {t("pickupDeadline", {
                date: new Intl.DateTimeFormat(locale, {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "America/Argentina/Cordoba",
                }).format(new Date(expiresAt)),
              })}
            </p>
          ) : null}
        </div>
      </div>
      <div
        className={
          paymentStatus === "pending" && !expired
            ? "grid gap-4 lg:grid-cols-5"
            : "max-w-3xl"
        }
      >
        {paymentStatus === "pending" && !expired ? (
          <div className="lg:col-span-3">
            <StepsCard
              title={t("nextTitle")}
              description={t("nextDescription")}
              steps={[
                {
                  id: "save",
                  icon: <FileText className="size-9" strokeWidth={1.5} />,
                  title: t("saveTitle"),
                  description: t("saveDescription"),
                },
                {
                  id: "collect",
                  icon: <Store className="size-9" strokeWidth={1.5} />,
                  title: t("collectTitle"),
                  description: t("collectDescription"),
                },
                {
                  id: "pay",
                  icon: <Banknote className="size-9" strokeWidth={1.5} />,
                  title: t("payTitle"),
                  description: t("payDescription"),
                },
              ]}
            />
          </div>
        ) : null}
        {summary ?? (
          <Card className="min-w-0 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-text-secondary font-serif text-2xl font-normal sm:text-3xl">
                {t("summaryTitle")}
              </CardTitle>
              <CardDescription className="text-base">
                {t("summaryDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="divide-border divide-y [&>div]:py-5 [&>div:first-child]:pt-0">
                {children}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <dt className="text-text-secondary">{t("paymentMethod")}</dt>
                  <dd className="flex items-center gap-3">
                    <Banknote
                      aria-hidden
                      className="text-text-secondary size-6"
                      strokeWidth={1.5}
                    />
                    {t("cashMethod")}
                  </dd>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <dt className="text-text-secondary">{t("paymentState")}</dt>
                  <dd className="flex items-center gap-3">
                    <Store
                      aria-hidden
                      className="text-text-secondary size-6"
                      strokeWidth={1.5}
                    />
                    {stateText(paymentStatus)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        )}
      </div>
      {paymentStatus === "pending" && !expired ? (
        <p className="bg-warm text-text-secondary flex items-center gap-5 rounded-xl p-5 text-base">
          <ShieldCheck
            aria-hidden
            className="text-earth size-8 shrink-0"
            strokeWidth={1.5}
          />
          <span>{notice}</span>
        </p>
      ) : null}
      {expired || paymentStatus === "cancelled" ? (
        <Button href={localizePath(locale, "/cart")}>{actions("retry")}</Button>
      ) : null}
      {paymentStatus === "pending" && reference ? (
        <div className="space-y-2">
          <Button
            variant="secondary"
            disabled={cancelling || refreshing}
            onClick={async () => {
              setCancelling(true);
              setCancelFailed(false);
              try {
                const response = await fetch("/api/orders", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "cancel-cash", reference }),
                });
                if (!response.ok) throw new Error();
                window.dispatchEvent(new Event("orders-updated"));
                startTransition(() => router.refresh());
              } catch {
                setCancelFailed(true);
              } finally {
                setCancelling(false);
              }
            }}
          >
            {t("cancel")}
          </Button>
          {cancelFailed ? <p role="alert">{t("cancelFailed")}</p> : null}
        </div>
      ) : null}
      <div className="border-border flex flex-col gap-6 border-t pt-5 sm:flex-row sm:items-center">
        {returnLink}
        <div className="flex flex-1 flex-wrap justify-center gap-6 sm:gap-10">
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

          {cashStaffEnabled && canRefresh && !expired && reference ? (
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
      </div>
      {paymentStatus === "approved" && reference && !receivedAt ? (
        <OrderReceiptFeedback reference={reference} />
      ) : null}
    </div>
  );
}
