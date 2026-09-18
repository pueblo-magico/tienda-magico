"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { CheckoutOrder } from "@/types/commerce";
import { OrderSummary } from "./OrderSummary";
import { ReceiptConfirmationModal } from "./ReceiptConfirmationModal";
import { receiptConfirmationBody } from "./receipt-confirmation";

export function OrderReceiptPrompt({ order }: { order: CheckoutOrder }) {
  const t = useTranslations("orders.receipt");
  const [open, setOpen] = useState(false);
  const [received, setReceived] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const submitting = useRef(false);

  async function confirm() {
    const body = receiptConfirmationBody(order.publicReference, open);
    if (!body || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setFailed(false);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error("receipt");
      setReceived(true);
      setOpen(false);
    } catch {
      setFailed(true);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  if (order.receivedAt || received)
    return (
      <p role="status" className="text-text-secondary mt-3 text-sm">
        {t("received")}
      </p>
    );
  return (
    <>
      <div className="text-text-secondary mt-3 flex flex-wrap items-center gap-3 text-sm">
        <PackageCheck aria-hidden className="size-5" strokeWidth={1.5} />
        <span>{t("inlineQuestion")}</span>
        <Button
          variant="link"
          size="sm"
          onPress={() => {
            setFailed(false);
            setOpen(true);
          }}
        >
          {t("inlineConfirm")}
        </Button>
      </div>
      {open ? (
        <ReceiptConfirmationModal
          summary={<OrderSummary order={order} />}
          busy={busy}
          failed={failed}
          onClose={() => {
            if (!submitting.current) setOpen(false);
          }}
          onConfirm={() => {
            void confirm();
          }}
        />
      ) : null}
    </>
  );
}
