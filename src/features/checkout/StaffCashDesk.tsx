"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Banknote, LockKeyhole } from "lucide-react";
import {
  Card,
  CardHeader,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { cashReview } from "./cash-review";
import { CashPaymentConfirmation } from "./CashPaymentConfirmation";
import { PageTitle } from "@/components/typography/PageTitle";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/commerce/utils/format";
import {
  isStaffCashOrder,
  staffCashErrorCode,
  type StaffCashOrder,
} from "@/types/staff-cash";

export function StaffCashDesk({
  initialReference = "",
}: {
  initialReference?: string;
}) {
  const t = useTranslations("checkout.staffCash");
  const states = useTranslations("orders.states");
  const locale = useLocale();
  const [access, setAccess] = useState<"checking" | "guest" | "staff">(
    "checking",
  );
  const [reference, setReference] = useState(initialReference);
  const [order, setOrder] = useState<StaffCashOrder | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [review, setReview] = useState<{
    order: StaffCashOrder;
    received: number;
  } | null>(null);
  const confirming = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/staff/cash", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (result) => {
        if (!result.ok) {
          setAccess("guest");
          if (result.status !== 401) setError("unavailable");
          return;
        }
        setAccess("staff");
        if (initialReference) {
          setBusy(true);
          const response = await fetch("/api/staff/cash", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "order",
              reference: initialReference,
            }),
            signal: controller.signal,
          });
          const value = await response.json();
          if (response.ok && isStaffCashOrder(value.order))
            setOrder(value.order);
          else if (response.status === 401) setAccess("guest");
          else setError(staffCashErrorCode(value.code));
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setAccess("guest");
          setError("unavailable");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [initialReference]);

  async function request(action: string, data: Record<string, unknown> = {}) {
    const result = await fetch("/api/staff/cash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...data }),
    });
    const body = await result.json();
    if (!result.ok) {
      if (result.status === 401) {
        setAccess("guest");
        setOrder(null);
        setConfirmed(false);
        setReview(null);
      }
      throw new Error(staffCashErrorCode(body.code));
    }
    return body;
  }

  async function run(operation: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await operation();
    } catch (failure) {
      setError(
        staffCashErrorCode(failure instanceof Error ? failure.message : null),
      );
    } finally {
      setBusy(false);
    }
  }

  async function loadOrder() {
    setOrder(null);
    setConfirmed(false);
    const result = await request("order", { reference: reference.trim() });
    if (!isStaffCashOrder(result.order)) throw new Error("unavailable");
    setOrder(result.order);
  }

  function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const password = new FormData(form).get("password");
    form.reset();
    void run(async () => {
      await request("login", { password });
      setAccess("staff");
      if (reference.trim()) await loadOrder();
    });
  }

  return (
    <Card>
      <CardHeader>
        <PageTitle
          as="h1"
          className="text-text-primary flex items-center gap-2 text-2xl sm:text-2xl lg:text-2xl"
        >
          <LockKeyhole aria-hidden strokeWidth={1.5} />
          {t("title")}
        </PageTitle>
        <CardDescription>{t("intro")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {access === "checking" ? (
          <p role="status">{t("loading")}</p>
        ) : access === "guest" ? (
          <form onSubmit={login} className="space-y-4">
            <Input
              name="password"
              type="password"
              label={t("password")}
              autoComplete="current-password"
              maxLength={128}
              required
              disabled={busy}
            />
            <Button type="submit" disabled={busy}>
              {busy ? t("loading") : t("login")}
            </Button>
          </form>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-text-secondary text-sm">{t("session")}</p>
              <Button
                variant="link"
                size="sm"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    await request("logout");
                    setAccess("guest");
                    setOrder(null);
                    setConfirmed(false);
                  })
                }
              >
                {t("logout")}
              </Button>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void run(loadOrder);
              }}
              className="space-y-3"
            >
              <Input
                name="reference"
                label={t("reference")}
                value={reference}
                onChange={(event) => {
                  setReference(event.target.value);
                  setOrder(null);
                  setConfirmed(false);
                }}
                maxLength={36}
                required
                disabled={busy}
              />
              <Button type="submit" variant="secondary" disabled={busy}>
                {t("lookup")}
              </Button>
            </form>
            {order ? (
              <div className="border-border space-y-4 border-t pt-4">
                <dl className="space-y-2">
                  <div>
                    <dt className="text-text-secondary text-sm">
                      {t("reference")}
                    </dt>
                    <dd className="break-all">{order.reference}</dd>
                  </div>
                  {order.buyerName ? (
                    <div>
                      <dt className="text-text-secondary text-sm">
                        {t("buyer")}
                      </dt>
                      <dd>{order.buyerName}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="text-text-secondary text-sm">
                      {t("total")}
                    </dt>
                    <dd className="text-text-primary text-2xl font-bold">
                      {formatMoney(
                        {
                          amount: (order.amount / 100).toFixed(2),
                          currencyCode: order.currency,
                        },
                        locale,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-secondary text-sm">
                      {t("status")}
                    </dt>
                    <dd>{states(order.status)}</dd>
                  </div>
                </dl>
                {["pending", "unverified"].includes(order.status) ? (
                  <form
                    key={order.reference}
                    className="space-y-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const calculation = cashReview(
                        order.amount,
                        new FormData(event.currentTarget).get("amount"),
                      );
                      if (!calculation) {
                        setError("amount");
                        return;
                      }
                      setError("");
                      setReview({
                        order: { ...order },
                        received: calculation.received,
                      });
                    }}
                  >
                    <Input
                      name="amount"
                      format="ars-pesos"
                      label={t("amount")}
                      hint={t("amountHint")}
                      required
                      disabled={busy}
                    />
                    <p className="text-text-secondary text-sm">
                      {t("warning")}
                    </p>
                    <Button
                      type="submit"
                      disabled={busy}
                      className="w-full"
                      textCase="sentence"
                    >
                      <Banknote aria-hidden strokeWidth={2} />
                      {busy ? t("loading") : t("review.open")}
                    </Button>
                  </form>
                ) : null}
              </div>
            ) : null}
          </>
        )}
        {review && access === "staff" ? (
          <CashPaymentConfirmation
            order={review.order}
            received={review.received}
            busy={busy}
            error={error}
            onClose={() => {
              if (!confirming.current) setReview(null);
            }}
            onConfirm={() => {
              if (confirming.current) return;
              confirming.current = true;
              void run(async () => {
                await request("confirm", {
                  reference: review.order.reference,
                  amount: review.received,
                  received: true,
                });
                setOrder({ ...review.order, status: "approved" });
                setConfirmed(true);
                setReview(null);
              }).finally(() => {
                confirming.current = false;
              });
            }}
          />
        ) : null}
        {confirmed ? (
          <p role="status" className="text-text-primary">
            {t("success")}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="text-text-accent">
            {t(`errors.${error}`)}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
