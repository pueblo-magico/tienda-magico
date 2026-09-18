"use client";

import { useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Check,
  Banknote,
  PackageCheck,
  Heart,
  ShoppingBag,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageTitle } from "@/components/typography/PageTitle";
import { Eyebrow } from "@/components/typography/Eyebrow";
import { OrderReceiptFeedback } from "@/features/orders/OrderReceiptFeedback";
import { localizePath } from "@/config/navigation";

export function CashConfirmed({
  summary,
  reference,
  receivedAt: persistedReceivedAt,
  returnLink,
  feedbackSubmitted = false,
}: {
  summary: ReactNode;
  reference: string;
  receivedAt?: string | null;
  returnLink?: ReactNode;
  feedbackSubmitted?: boolean;
}) {
  const t = useTranslations("checkout.cashConfirmed");
  const orders = useTranslations("orders.receipt");
  const locale = useLocale();
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  async function confirmReceipt() {
    if (saving) return;
    setSaving(true);
    setFailed(false);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm-receipt", reference }),
      });
      if (!response.ok) throw new Error("receipt");
      setConfirmed(true);
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  }
  const receivedAt = Boolean(persistedReceivedAt) || confirmed;
  const steps = [
    { title: t("ordered"), body: t("orderedBody"), done: true },
    { title: t("paid"), body: t("paidBody"), done: true },
    {
      title: receivedAt ? orders("received") : t("receive"),
      body: receivedAt ? t("receivedBody") : t("receiveBody"),
      done: Boolean(receivedAt),
    },
  ];
  return (
    <div className="space-y-6">
      <header
        className="mx-auto max-w-3xl space-y-3 py-4 text-center"
        role="status"
        aria-live="polite"
      >
        <span className="bg-warm text-text-secondary mx-auto flex size-20 items-center justify-center rounded-full">
          <Check aria-hidden className="size-10" strokeWidth={2} />
        </span>
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <PageTitle as="h1" className="text-3xl sm:text-4xl lg:text-5xl">
          {t("title")}
        </PageTitle>
        <p className="text-text-primary text-lg">{t("description")}</p>
      </header>
      <div className="grid items-stretch gap-4 lg:grid-cols-2">
        <div className="min-w-0 [&>div]:h-full">{summary}</div>
        <Card>
          <CardHeader>
            <CardTitle variant="editorial">{t("timeline")}</CardTitle>
            <CardDescription>{t("timelineBody")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <ol>
              {steps.map((step, index) => (
                <li
                  key={step.title}
                  className="relative flex gap-5 pb-6 last:pb-0"
                >
                  {index < steps.length - 1 ? (
                    <span
                      aria-hidden
                      className="border-border absolute top-10 bottom-0 left-5 border-l border-dashed"
                    />
                  ) : null}
                  <span
                    aria-hidden
                    className={`relative flex size-10 shrink-0 items-center justify-center rounded-full ${step.done ? "bg-background-secondary text-brand-foreground" : "bg-warm text-text-secondary"}`}
                  >
                    {step.done ? <Check className="size-6" /> : index + 1}
                  </span>
                  <div>
                    <h3 className="text-text-secondary font-serif text-xl">
                      {step.title}
                    </h3>
                    <p className="text-text-primary mt-1 text-sm leading-relaxed">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <Button href={localizePath(locale, "/orders")} className="w-full">
              <ShoppingBag aria-hidden className="size-5" />
              {t("orders")}
            </Button>
            {!receivedAt ? (
              <>
                <Button
                  onPress={() => {
                    void confirmReceipt();
                  }}
                  disabled={saving}
                  aria-busy={saving}
                  variant="secondary"
                  className="w-full"
                >
                  <PackageCheck aria-hidden className="size-5" />
                  {t("receive")}
                </Button>
                <p className="text-text-primary text-sm">{t("warning")}</p>
                {failed ? (
                  <p role="alert" className="text-terracotta">
                    {orders("error")}
                  </p>
                ) : null}
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
      <aside className="bg-warm text-text-secondary flex items-center gap-5 rounded-xl p-5">
        <Heart aria-hidden className="size-9 shrink-0" strokeWidth={1.5} />
        <div>
          <h2 className="font-serif text-2xl">{t("impact")}</h2>
          <p>{t("impactBody")}</p>
        </div>
      </aside>
      {!feedbackSubmitted ? (
        <section
          id="receipt-feedback"
          className="scroll-mt-24"
          aria-label={orders("feedbackTitle")}
        >
          <OrderReceiptFeedback
            reference={reference}
            layout="wide"
            feedbackOnly
          />
        </section>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {returnLink}
        <Button variant="secondary" href={localizePath(locale, "/shop")}>
          <Banknote aria-hidden className="size-5" />
          {t("explore")}
        </Button>
      </div>
    </div>
  );
}
