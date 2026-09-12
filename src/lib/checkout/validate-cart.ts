import type { Cart } from "@/types/commerce";
import { CheckoutError } from "@/types/checkout";

export function validateCheckoutCart(cart: Cart, locale?: string | null) {
  const quantities = new Map<string, number>();
  if (
    cart.lines.some((line) => {
      const quantity =
        (quantities.get(line.merchandise.id) ?? 0) + line.quantity;
      quantities.set(line.merchandise.id, quantity);
      return (
        line.issue ||
        !Number.isSafeInteger(line.quantity) ||
        line.quantity <= 0 ||
        (line.maxPurchaseQuantity != null &&
          quantity > line.maxPurchaseQuantity)
      );
    })
  ) {
    throw new CheckoutError(
      locale === "en"
        ? "Review your cart. Update quantities to accept current prices, or remove unavailable items."
        : "Revisá tu carrito. Actualizá las cantidades para aceptar los precios actuales o quitá los artículos no disponibles.",
      { status: 409 },
    );
  }
}
