import Image from "next/image";
import { Package2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import type { CheckoutOrder } from "@/types/commerce";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import { CopyButton } from "@/components/ui/CopyButton";

export function OrderSummary({ order }: { order: CheckoutOrder }) {
  const t = useTranslations("orders.summary");
  const copy = useTranslations("orders");
  const format = useFormatter();
  const money = (amount: string, currency: string) =>
    format.number(Number(amount), { style: "currency", currency });
  const date = order.createdAt ? new Date(order.createdAt) : null;
  return (
    <Card className="min-w-0 lg:col-span-2">
      <CardHeader layout="split">
        <div className="min-w-0 space-y-1">
          <CardTitle variant="editorial">{t("title")}</CardTitle>
          {date && !Number.isNaN(date.getTime()) ? (
            <CardDescription>
              {t("placed", {
                date: format.dateTime(date, {
                  dateStyle: "long",
                  timeZone: "America/Argentina/Buenos_Aires",
                }),
              })}
            </CardDescription>
          ) : null}
        </div>
        <div className="bg-warm text-text-secondary flex shrink-0 items-center gap-1 rounded-lg px-3 py-2">
          <span title={order.publicReference}>
            #{order.publicReference.slice(0, 8).toUpperCase()}
          </span>
          <CopyButton
            value={order.publicReference}
            label={copy("copy")}
            copiedLabel={copy("copied")}
            errorLabel={copy("copyFailed")}
          />
        </div>
      </CardHeader>
      <CardContent>
        {order.items?.length ? (
          <ul className="divide-border border-border divide-y border-t">
            {order.items.map((item, index) => (
              <li
                key={index}
                className="flex flex-wrap items-center gap-3 py-4"
              >
                <div className="bg-warm relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg sm:size-20">
                  {item.image ? (
                    <Image
                      src={item.image.url}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <Package2
                      aria-hidden
                      className="text-text-primary size-7"
                      strokeWidth={1.5}
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-text-black text-sm break-words sm:text-base">
                    {item.title}
                  </p>
                  <p className="text-text-primary text-sm sm:hidden">
                    {t("quantity", { quantity: item.quantity })}
                  </p>
                </div>
                <span
                  className="text-text-primary hidden shrink-0 text-sm sm:block"
                  aria-label={t("quantity", { quantity: item.quantity })}
                >
                  × {item.quantity}
                </span>
                <span className="text-text-secondary shrink-0 font-bold">
                  {money(item.total.amount, item.total.currencyCode)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-text-primary py-4 text-sm">{t("unavailable")}</p>
        )}
        <div className="bg-warm text-text-secondary mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg px-4 py-3">
          <span className="font-serif text-xl">
            {order.paymentStatus === "approved" ? t("paid") : t("total")}
          </span>
          <strong className="text-2xl">
            {money(order.total.amount, order.total.currencyCode)}
          </strong>
        </div>
      </CardContent>
    </Card>
  );
}
