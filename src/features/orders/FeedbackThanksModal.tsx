"use client";

import { Check, Heart, Sprout } from "lucide-react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Rating } from "@/components/ui/Rating";

export function FeedbackThanksModal({
  open,
  onClose,
  rating,
}: {
  open: boolean;
  onClose: () => void;
  rating: number;
}) {
  const t = useTranslations("orders.feedbackThanks");
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("title")}
      closeLabel={t("close")}
      variant="celebration"
    >
      <div className="space-y-5">
        <div
          aria-hidden
          className="text-text-secondary flex items-center justify-center gap-4"
        >
          <Sprout className="text-text-accent size-12" strokeWidth={1.5} />
          <span className="bg-warm relative flex size-24 items-center justify-center rounded-full">
            <Heart className="size-12 fill-current" strokeWidth={1.5} />
            <Check
              className="text-brand-foreground absolute size-6"
              strokeWidth={2}
            />
          </span>
          <Sprout
            className="text-text-accent size-12 -scale-x-100"
            strokeWidth={1.5}
          />
        </div>
        <p className="text-text-secondary text-xs tracking-widest uppercase">
          {t("eyebrow")}
        </p>
        <p className="text-text-black font-serif text-3xl leading-tight sm:text-4xl">
          {t("title")}
        </p>
        <p className="text-text-primary leading-relaxed">{t("body")}</p>
        {rating > 0 ? (
          <div className="space-y-2">
            <Rating
              size="lg"
              value={rating}
              label={t("rating", { rating })}
              className="justify-center"
            />
            <p className="text-text-primary text-sm">{t("sent")}</p>
          </div>
        ) : null}
        <Button className="w-full" onPress={onClose}>
          {t("continue")}
        </Button>
      </div>
    </Modal>
  );
}
