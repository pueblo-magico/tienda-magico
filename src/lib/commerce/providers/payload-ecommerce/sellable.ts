import type { ProductVariant } from "@/types/commerce";

export function regularPrice(item: Record<string, unknown>): number | null {
  const amount = item.priceInARS;
  return item.priceInARSEnabled === true &&
    typeof amount === "number" &&
    Number.isSafeInteger(amount) &&
    amount > 0
    ? amount
    : null;
}

export function purchaseStatus(
  item: Record<string, unknown>,
): ProductVariant["purchaseStatus"] {
  if (item._status !== "published" || item.lifecycleStatus === "discontinued")
    return "unavailable";
  if (regularPrice(item) == null) return "unpriced";
  if (
    typeof item.inventory !== "number" ||
    !Number.isSafeInteger(item.inventory) ||
    item.inventory <= 0
  )
    return "soldOut";
  return "available";
}

export function publicSellable(item: Record<string, unknown>) {
  const unit = item.netContentUnit;
  return {
    purchaseStatus: purchaseStatus(item),
    maxPurchaseQuantity: item.oneOfAKind === true ? 1 : null,
    netContent:
      typeof item.netContent === "number" &&
      Number.isFinite(item.netContent) &&
      item.netContent > 0 &&
      (unit === "g" || unit === "ml" || unit === "unit")
        ? { quantity: item.netContent, unit }
        : null,
    salesUnit:
      item.salesUnit === "pack" ? ("pack" as const) : ("unit" as const),
  };
}
