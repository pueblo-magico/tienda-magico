"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Info, PackageCheck, Sprout } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export function ReceiptConfirmationModal({
  summary,
  busy,
  failed,
  onClose,
  onConfirm,
}: {
  summary: ReactNode;
  busy: boolean;
  failed: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("orders.receiptConfirmation");
  const receipt = useTranslations("orders.receipt");
  return (
    <Modal
      open
      title={t("title")}
      closeLabel={t("cancel")}
      variant="celebration"
      size="wide"
      isDismissable={!busy}
      onClose={onClose}
    >
      <div className="space-y-5" aria-busy={busy}>
        <div
          aria-hidden
          className="text-text-secondary flex items-center justify-center gap-4"
        >
          <Sprout className="text-text-accent size-12" strokeWidth={1.5} />
          <span className="bg-warm flex size-20 items-center justify-center rounded-full">
            <PackageCheck className="size-10" strokeWidth={1.5} />
          </span>
        </div>
        <p className="text-text-secondary text-sm font-bold tracking-widest uppercase">
          {t("eyebrow")}
        </p>
        <p className="text-text-black font-serif text-3xl leading-tight sm:text-4xl">
          {t("title")}
        </p>
        <p className="text-text-primary text-lg">{t("description")}</p>
        <div className="text-left">{summary}</div>
        <div className="bg-warm text-text-black flex items-start gap-4 rounded-xl p-4 text-left">
          <Info
            aria-hidden
            className="text-text-secondary size-7 shrink-0"
            strokeWidth={1.5}
          />
          <p>{t("warning")}</p>
        </div>
        {failed ? (
          <p role="alert" className="text-terracotta">
            {receipt("error")}
          </p>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="secondary" disabled={busy} onPress={onClose}>
            {t("cancel")}
          </Button>
          <Button disabled={busy} aria-busy={busy} onPress={onConfirm}>
            <CheckCircle2 aria-hidden strokeWidth={2} />
            {t(busy ? "saving" : "confirm")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
