import type { Cart } from "@/types/commerce";

export function checkoutReviewSnapshot(cart: Cart): string {
  return JSON.stringify({
    fulfillment: cart.fulfillmentMode,
    subtotal: cart.cost.subtotalAmount,
    total: cart.cost.totalAmount,
    tax: cart.cost.totalTaxAmount,
    lines: cart.lines
      .map((line) => ({
        id: line.id,
        merchandise: line.merchandise.id,
        quantity: line.quantity,
        cost: line.cost,
      }))
      .sort((first, second) => first.id.localeCompare(second.id)),
  });
}

export function hasCheckoutReview(input: {
  acceptedTerms?: unknown;
  reviewedCart?: unknown;
}): boolean {
  return (
    input.acceptedTerms === true &&
    typeof input.reviewedCart === "string" &&
    input.reviewedCart.length > 0
  );
}
