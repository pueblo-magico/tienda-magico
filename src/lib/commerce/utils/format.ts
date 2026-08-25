import type { Money } from "@/types/commerce";

export function formatMoney(
  money: Money,
  locale = "es-AR",
  options?: Intl.NumberFormatOptions,
): string {
  const amount = Number.parseFloat(money.amount);

  if (Number.isNaN(amount)) {
    return money.amount;
  }

  try {
    const regionalLocale = locale === "es" ? "es-AR" : locale === "en" ? "en-US" : locale;
    return new Intl.NumberFormat(regionalLocale, {
      style: "currency",
      currency: money.currencyCode,
      ...(money.currencyCode === "ARS"
        ? { minimumFractionDigits: 0, maximumFractionDigits: 2 }
        : {}),
      ...options,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${money.currencyCode}`;
  }
}
