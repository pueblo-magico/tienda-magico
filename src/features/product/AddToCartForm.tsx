"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/features/cart";
import { formatMoney } from "@/lib/commerce/utils/format";
import type { Product, ProductVariant, SelectedOption } from "@/types/commerce";
import { cn } from "@/lib/utils/cn";
import { findVariant, getDefaultVariant } from "./utils";

type Props = {
  product: Product;
  labels: {
    addToCart: string;
    adding: string;
    soldOut: string;
    quantity: string;
    decrease: string;
    increase: string;
    from: string;
    unavailable: string;
    addFailed: string;
  };
};

function initialSelection(product: Product): SelectedOption[] {
  const variant = getDefaultVariant(product);
  if (variant?.selectedOptions?.length) {
    return variant.selectedOptions.map((opt) => ({
      name: opt.name,
      value: opt.value,
    }));
  }
  return product.options.map((option) => ({
    name: option.name,
    value: option.values[0] ?? "",
  }));
}

export function AddToCartForm({ product, labels }: Props) {
  const locale = useLocale();
  const { addItem, isMutating, configured, error: cartError } = useCart();
  const [selection, setSelection] = useState<SelectedOption[]>(() =>
    initialSelection(product),
  );
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<string | null>(null);

  const variant: ProductVariant | null = useMemo(
    () => findVariant(product, selection),
    [product, selection],
  );

  const available = Boolean(
    product.availableForSale && variant?.availableForSale,
  );

  const price = variant?.price ?? product.priceRange.minVariantPrice;
  const compareAt = variant?.compareAtPrice ?? null;
  const showOptions =
    product.options.length > 0 &&
    !(
      product.options.length === 1 &&
      product.options[0]?.values.length === 1 &&
      product.variants.length <= 1
    );

  const merchandiseId = variant?.id || product.id;

  return (
    <div className="space-y-5">
      <div className="border-border space-y-1 border-b pb-4">
        <p className="font-navigation text-text-black text-2xl">
          {formatMoney(price, locale)}
        </p>
        {compareAt && Number(compareAt.amount) > Number(price.amount) ? (
          <p className="text-muted text-sm line-through">
            {formatMoney(compareAt, locale)}
          </p>
        ) : null}
        {!variant &&
        product.priceRange.minVariantPrice.amount !==
          product.priceRange.maxVariantPrice.amount ? (
          <p className="text-muted text-xs tracking-[0.12em] uppercase">
            {labels.from}{" "}
            {formatMoney(product.priceRange.minVariantPrice, locale)}
          </p>
        ) : null}
      </div>

      {showOptions
        ? product.options.map((option) => {
            const current =
              selection.find((sel) => sel.name === option.name)?.value ??
              option.values[0];
            return (
              <fieldset key={option.id || option.name} className="space-y-2">
                <legend className="text-muted text-xs font-medium tracking-[0.14em] uppercase">
                  {option.name}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {option.values.map((value) => {
                    const active = current === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        className={cn(
                          "min-w-20 rounded-lg border px-4 py-2 text-sm transition-colors",
                          active
                            ? "border-forest bg-forest text-brand-foreground"
                            : "border-border bg-card text-forest hover:border-forest/40",
                        )}
                        onClick={() => {
                          setSelection((prev) => {
                            const next = prev.filter(
                              (sel) => sel.name !== option.name,
                            );
                            next.push({ name: option.name, value });
                            return next;
                          });
                          setMessage(null);
                        }}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            );
          })
        : null}

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-2">
          <p className="text-muted text-xs font-medium tracking-[0.14em] uppercase">
            {labels.quantity}
          </p>
          <div className="border-border bg-card inline-flex items-center rounded-lg border">
            <button
              type="button"
              className="h-11 w-11 rounded-full text-lg disabled:opacity-40"
              aria-label={labels.decrease}
              disabled={quantity <= 1 || isMutating}
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            >
              −
            </button>
            <span className="min-w-8 text-center tabular-nums">{quantity}</span>
            <button
              type="button"
              className="h-11 w-11 rounded-full text-lg disabled:opacity-40"
              aria-label={labels.increase}
              disabled={isMutating}
              onClick={() => setQuantity((value) => value + 1)}
            >
              +
            </button>
          </div>
        </div>

        <Button
          type="button"
          className="h-12 min-w-[12rem] flex-1"
          disabled={!configured || !available || isMutating || !merchandiseId}
          onClick={() => {
            void (async () => {
              setMessage(null);
              if (!configured) {
                setMessage(labels.unavailable);
                return;
              }
              const cart = await addItem({
                merchandiseId,
                quantity,
              });
              if (!cart) {
                setMessage(labels.addFailed);
              }
            })();
          }}
        >
          {!available
            ? labels.soldOut
            : isMutating
              ? labels.adding
              : labels.addToCart}
        </Button>
      </div>

      {message ? <p className="text-clay text-sm">{message}</p> : null}
      {!message && cartError ? (
        <p className="text-clay text-sm">{cartError}</p>
      ) : null}
      {!configured ? (
        <p className="text-muted text-sm">{labels.unavailable}</p>
      ) : null}
    </div>
  );
}
