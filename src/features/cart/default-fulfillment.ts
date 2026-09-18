import type { Cart } from "@/types/commerce";

export function shouldDefaultToPickup(
  cart: Pick<Cart, "id" | "fulfillmentMode">,
  pickupEnabled: boolean,
) {
  return Boolean(cart.id) && cart.fulfillmentMode === null && pickupEnabled;
}
