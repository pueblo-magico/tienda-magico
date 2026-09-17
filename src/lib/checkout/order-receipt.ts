import type { OrderReceiptFeedback } from "@/types/commerce";

export type OrderReceiptInput = OrderReceiptFeedback & { reference: string };

const publicReferencePattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseOrderReceiptInput(
  value: unknown,
): OrderReceiptInput | null {
  if (!value || typeof value !== "object") return null;
  if (!("action" in value) || value.action !== "confirm-receipt") return null;
  if (!("reference" in value) || typeof value.reference !== "string")
    return null;
  if (!("rating" in value) || typeof value.rating !== "number") return null;
  if (!Number.isInteger(value.rating) || value.rating < 0 || value.rating > 5) {
    return null;
  }
  const reference = value.reference.trim();
  if (!publicReferencePattern.test(reference)) return null;
  let comment = "";
  if ("comment" in value) {
    if (typeof value.comment !== "string") return null;
    comment = value.comment.trim();
  }
  if (comment.length > 1000) return null;
  return { reference, rating: value.rating, ...(comment ? { comment } : {}) };
}
