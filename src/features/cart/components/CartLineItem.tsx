"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { localizePath } from "@/config/navigation";
import type { CartLine } from "@/types/commerce";
import { formatMoney } from "@/lib/commerce/utils/format";
import { cn } from "@/lib/utils/cn";
import { MinusIcon, PlusIcon } from "@phosphor-icons/react";
import { useCart } from "../CartProvider";

type Props = {
  line: CartLine;
  disabled?: boolean;
  onQuantityChange: (lineId: string, quantity: number) => void;
  onRemove: (lineId: string) => void;
  labels: {
    remove: string;
    quantity: string;
    decrease: string;
    increase: string;
  };
  className?: string;
};

export function CartLineItem({
  line,
  disabled,
  onQuantityChange,
  onRemove,
  labels,
  className,
}: Props) {
  const locale = useLocale();
  const t = useTranslations("commercial");
  const { confirmPrices } = useCart();
  const productHref = localizePath(
    locale,
    `/shop/${line.merchandise.product.handle}`,
  );
  const image = line.merchandise.product.featuredImage;
  const options = line.merchandise.selectedOptions
    .map((option) => option.value)
    .filter(Boolean)
    .join(" · ");

  return (
    <article className={cn("flex gap-4 py-5", className)}>
      <Link
        href={productHref}
        className="bg-warm relative h-24 w-20 shrink-0 overflow-hidden rounded-lg sm:h-28 sm:w-24"
      >
        {image?.url ? (
          <Image
            src={image.url}
            alt={image.altText || line.merchandise.product.title}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <span className="text-muted flex h-full items-center justify-center text-[10px] tracking-wider uppercase">
            —
          </span>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={productHref}
              className="font-navigation text-text-black text-lg leading-snug hover:underline"
            >
              {line.merchandise.product.title}
            </Link>
            {options ? (
              <p className="text-muted mt-0.5 text-xs">{options}</p>
            ) : null}
          </div>
          <p className="text-forest shrink-0 text-sm font-medium">
            {formatMoney(line.cost.totalAmount, locale)}
          </p>
        </div>

        {line.issue ? (
          <p role="status" className="text-text-accent text-sm">
            {t(line.issue)}
          </p>
        ) : null}
        {line.issue !== "unavailable" ? (
          <p className="text-text-primary text-xs">
            {t("unitPrice", {
              price: formatMoney(line.cost.amountPerQuantity, locale),
            })}
          </p>
        ) : null}
        {line.issue === "priceChanged" ? (
          <Button
            variant="secondary"
            disabled={disabled}
            onClick={() => void confirmPrices()}
          >
            {t("confirmPrice")}
          </Button>
        ) : null}
        <div className="flex items-center justify-between gap-3">
          <div
            className="border-border bg-background-primary inline-flex items-center rounded-lg border"
            aria-label={labels.quantity}
          >
            <button
              type="button"
              className="h-8 w-8 rounded-full text-sm disabled:opacity-40"
              disabled={disabled || line.quantity <= 1}
              aria-label={labels.decrease}
              onClick={() => onQuantityChange(line.id, line.quantity - 1)}
            >
              <MinusIcon aria-hidden className="mx-auto size-3.5" />
            </button>
            <span className="min-w-6 text-center text-sm tabular-nums">
              {line.quantity}
            </span>
            <button
              type="button"
              className="h-8 w-8 rounded-full text-sm disabled:opacity-40"
              disabled={
                disabled ||
                Boolean(line.issue && line.issue !== "priceChanged") ||
                line.quantity >=
                  (line.maxPurchaseQuantity ?? Number.MAX_SAFE_INTEGER)
              }
              aria-label={labels.increase}
              onClick={() => onQuantityChange(line.id, line.quantity + 1)}
            >
              <PlusIcon aria-hidden className="mx-auto size-3.5" />
            </button>
          </div>

          <button
            type="button"
            className="text-muted hover:text-forest text-xs tracking-[0.12em] uppercase underline-offset-4 hover:underline disabled:opacity-40"
            disabled={disabled}
            onClick={() => onRemove(line.id)}
          >
            {labels.remove}
          </button>
        </div>
      </div>
    </article>
  );
}
