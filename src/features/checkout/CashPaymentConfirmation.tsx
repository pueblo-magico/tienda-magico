"use client";

import { Banknote, FileText, ShieldCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { formatMoney } from "@/lib/commerce/utils/format";
import type { StaffCashOrder } from "@/types/staff-cash";

export function CashPaymentConfirmation({
  order,
  received,
  busy,
  error,
  onClose,
  onConfirm,
}: {
  order: StaffCashOrder;
  received: number;
  busy: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("checkout.staffCash");
  const locale = useLocale();
  const money = (amount: number) =>
    formatMoney(
      { amount: (amount / 100).toFixed(2), currencyCode: order.currency },
      locale,
    );
  return (
    <Modal
      open
      title={t("review.title")}
      variant="celebration"
      size="wide"
      closeLabel={t("review.back")}
      onClose={onClose}
      isDismissable={!busy}
    >
      <div className="space-y-4">
        <div className="bg-warm text-text-secondary mx-auto flex size-16 items-center justify-center rounded-full">
          <Banknote aria-hidden className="size-8" strokeWidth={1.5} />
        </div>
        <p className="text-text-accent text-sm font-bold tracking-widest uppercase">
          {t("review.eyebrow")}
        </p>
        <p className="text-text-black font-serif text-3xl leading-tight">
          {t("review.title")}
        </p>
        <p className="text-text-primary">{t("review.body")}</p>
        <Card>
          <CardContent className="flex items-center gap-4 text-left">
            <FileText
              aria-hidden
              className="text-text-accent size-8 shrink-0"
              strokeWidth={1.5}
            />
            <div className="min-w-0 space-y-1">
              <p
                className="text-text-black font-serif text-xl"
                title={order.reference}
              >
                #{order.reference.slice(0, 8)}
              </p>
              {order.buyerName ? (
                <p className="text-text-primary">
                  {t("buyer")}: {order.buyerName}
                </p>
              ) : null}
              <p className="text-text-primary text-sm">{t("review.method")}</p>
            </div>
          </CardContent>
        </Card>
        <dl className="border-border divide-border divide-y rounded-xl border px-4 text-left">
          {(
            [
              [t("total"), order.amount],
              [t("review.received"), received],
              [t("review.change"), received - order.amount],
            ] as const
          ).map(([label, amount]) => (
            <div
              key={label}
              className="flex flex-wrap items-center justify-between gap-2 py-3"
            >
              <dt className="text-text-primary text-sm">{label}</dt>
              <dd className="text-text-secondary text-2xl font-bold">
                {money(amount)}
              </dd>
            </div>
          ))}
        </dl>
        <div className="bg-warm text-text-black flex gap-3 rounded-xl p-4 text-left text-sm">
          <ShieldCheck
            aria-hidden
            className="text-text-accent size-7 shrink-0"
            strokeWidth={1.5}
          />
          <p>{t("warning")}</p>
        </div>
        {error ? (
          <p role="alert" className="text-text-accent">
            {t(`errors.${error}`)}
          </p>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="secondary" disabled={busy} onPress={onClose}>
            {t("review.back")}
          </Button>
          <Button disabled={busy} aria-busy={busy} onPress={onConfirm}>
            <Banknote aria-hidden strokeWidth={2} />
            {busy
              ? t("loading")
              : t("review.confirm", { amount: money(order.amount) })}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
