"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/Card";
import { RatingInput } from "@/components/ui/Rating";
import { Textarea } from "@/components/ui/Textarea";
import { FeedbackThanksModal } from "./FeedbackThanksModal";

export function OrderReceiptFeedback({
  reference,
  layout = "stack",
  onConfirmed,
  formId,
  feedbackOnly = false,
}: {
  reference: string;
  layout?: "stack" | "wide";
  onConfirmed?: () => void;
  formId?: string;
  feedbackOnly?: boolean;
}) {
  const t = useTranslations("orders.receipt");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [thanksOpen, setThanksOpen] = useState(false);

  if (dismissed) return null;
  if (saved)
    return feedbackOnly ? (
      <>
        <FeedbackThanksModal
          open={thanksOpen}
          onClose={() => setThanksOpen(false)}
          rating={rating}
        />
        <p role="status" className="text-text-secondary">
          {t("thanks")}
        </p>
      </>
    ) : null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setFailed(false);
    setSaving(true);
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: feedbackOnly ? "submit-feedback" : "confirm-receipt",
        reference,
        rating,
        comment,
      }),
    }).catch(() => null);
    setSaving(false);
    if (!response?.ok) {
      setFailed(true);
      return;
    }
    setSaved(true);
    setThanksOpen(feedbackOnly);
    onConfirmed?.();
  }

  return (
    <Card className="mt-4">
      <CardContent
        className={
          layout === "wide" ? "grid gap-6 lg:grid-cols-3" : "space-y-5"
        }
      >
        <div className="flex items-start gap-3">
          <CheckCircle2
            aria-hidden
            className="text-text-accent mt-1 size-7 shrink-0"
            strokeWidth={1.5}
          />
          <div className="space-y-1">
            <CardTitle>{t(feedbackOnly ? "feedbackTitle" : "open")}</CardTitle>
            <CardDescription>
              {t(feedbackOnly ? "feedbackDescription" : "description")}
            </CardDescription>
          </div>
        </div>
        <form
          id={formId}
          className={
            layout === "wide"
              ? "grid gap-4 sm:grid-cols-2 lg:col-span-2"
              : "space-y-4"
          }
          onSubmit={submit}
        >
          <RatingInput
            value={rating}
            onChange={setRating}
            label={t("ratingLabel")}
            clearLabel={t("ratingValues.0")}
            valueLabel={(value) => t(`ratingValues.${value}`)}
            disabled={saving}
          />
          <Textarea
            name="experienceComment"
            label={t("commentLabel")}
            placeholder={t("commentPlaceholder")}
            value={comment}
            maxLength={1000}
            disabled={saving}
            onChange={(event) => setComment(event.currentTarget.value)}
            hint={t("commentHint")}
          />
          {failed ? (
            <p role="alert" className="text-terracotta text-sm">
              {t("error")}
            </p>
          ) : null}
          <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
            <Button type="submit" disabled={saving} aria-busy={saving}>
              {t(feedbackOnly ? "submitFeedback" : "confirm")}
            </Button>
            {!formId || feedbackOnly ? (
              <Button
                variant="secondary"
                disabled={saving}
                onPress={() => setDismissed(true)}
              >
                {t("skip")}
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
