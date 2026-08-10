import type { Money } from "@/types/commerce";

export function formatMoney(
  money: Money,
  locale = "en-US",
  options?: Intl.NumberFormatOptions,
): string {
  const amount = Number.parseFloat(money.amount);

  if (Number.isNaN(amount)) {
    return money.amount;
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: money.currencyCode,
      ...options,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${money.currencyCode}`;
  }
}
