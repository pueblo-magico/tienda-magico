import { localizePath } from "@/config/navigation";

export function pendingReturnLink(source: unknown, locale: string) {
  return source === "orders"
    ? {
        href: localizePath(locale, "/orders"),
        labelKey: "backToOrders" as const,
      }
    : { href: localizePath(locale, "/cart"), labelKey: "backToCart" as const };
}
