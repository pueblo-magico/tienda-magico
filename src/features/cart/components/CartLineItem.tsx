"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { localizePath } from "@/config/navigation";
import type { CartLine } from "@/types/commerce";
import { formatMoney } from "@/lib/commerce/utils/format";
import { cn } from "@/lib/utils/cn";

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
  const productHref = localizePath(locale, `/shop/${line.merchandise.product.handle}`);
  const image = line.merchandise.product.featuredImage;
  const options = line.merchandise.selectedOptions
    .map((option) => option.value)
    .filter(Boolean)
    .join(" · ");

  return (
    <article
      className={cn(
        "flex gap-3 border-b border-border py-4 last:border-b-0",
        className,
      )}
    >
      <Link
        href={productHref}
        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-sand/40"
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
          <span className="flex h-full items-center justify-center text-[10px] uppercase tracking-wider text-muted">
            —
          </span>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={productHref}
              className="font-serif text-base leading-snug text-forest hover:underline"
            >
              {line.merchandise.product.title}
            </Link>
            {options ? (
              <p className="mt-0.5 text-xs text-muted">{options}</p>
            ) : null}
          </div>
          <p className="shrink-0 text-sm font-medium text-forest">
            {formatMoney(line.cost.totalAmount, locale)}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div
            className="inline-flex items-center rounded-full border border-border"
            aria-label={labels.quantity}
          >
            <button
              type="button"
              className="h-8 w-8 rounded-full text-sm disabled:opacity-40"
              disabled={disabled || line.quantity <= 1}
              aria-label={labels.decrease}
              onClick={() => onQuantityChange(line.id, line.quantity - 1)}
            >
              −
            </button>
            <span className="min-w-6 text-center text-sm tabular-nums">
              {line.quantity}
            </span>
            <button
              type="button"
              className="h-8 w-8 rounded-full text-sm disabled:opacity-40"
              disabled={disabled}
              aria-label={labels.increase}
              onClick={() => onQuantityChange(line.id, line.quantity + 1)}
            >
              +
            </button>
          </div>

          <button
            type="button"
            className="text-xs uppercase tracking-[0.12em] text-muted underline-offset-4 hover:text-forest hover:underline disabled:opacity-40"
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
