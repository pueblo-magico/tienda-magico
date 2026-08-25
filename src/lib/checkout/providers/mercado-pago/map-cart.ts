import type { Cart } from "@/types/commerce";
import { CheckoutError } from "@/types/checkout";

export type MercadoPagoPreferenceItem = {
  id: string;
  title: string;
  description?: string;
  quantity: number;
  unit_price: number;
  currency_id: string;
  picture_url?: string;
};

export function cartToPreferenceItems(cart: Cart): MercadoPagoPreferenceItem[] {
  if (!cart.lines.length) {
    throw new CheckoutError("Cannot checkout an empty cart.", {
      provider: "mercado-pago",
    });
  }

  return cart.lines.map((line) => {
    const amount = Number.parseFloat(line.cost.amountPerQuantity.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      throw new CheckoutError(
        `Invalid unit price for cart line "${line.id}".`,
        { provider: "mercado-pago" },
      );
    }

    const currency =
      line.cost.amountPerQuantity.currencyCode ||
      cart.cost.subtotalAmount.currencyCode ||
      "ARS";

    const title =
      line.merchandise.product.title ||
      line.merchandise.title ||
      "Item";

    const item: MercadoPagoPreferenceItem = {
      id: line.merchandise.id || line.id,
      title: title.slice(0, 256),
      quantity: Math.max(1, Math.floor(line.quantity)),
      unit_price: Number(amount.toFixed(2)),
      currency_id: currency.toUpperCase(),
    };

    if (line.merchandise.product.featuredImage?.url) {
      item.picture_url = line.merchandise.product.featuredImage.url;
    }

    const description = line.merchandise.selectedOptions
      .map((option) => `${option.name}: ${option.value}`)
      .join(" · ");
    if (description) {
      item.description = description.slice(0, 256);
    }

    return item;
  });
}
