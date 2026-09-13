"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MinusIcon, PlusIcon } from "@phosphor-icons/react";
import { useProductSelection } from "./ProductSelection";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/features/cart";
import { formatMoney } from "@/lib/commerce/utils/format";
import type { Product, ProductVariant, SelectedOption } from "@/types/commerce";
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
    productUnavailable: string;
    addFailed: string;
  };
};

function initialSelection(product: Product): SelectedOption[] {
  const variant = getDefaultVariant(product);
  if (variant?.selectedOptions?.length) {
    return variant.selectedOptions.map((opt) => ({ ...opt }));
  }
  return product.options.map((option) => ({
    name: option.name,
    value: option.values[0] ?? "",
  }));
}

export function AddToCartForm({ product, labels }: Props) {
  const locale = useLocale();
  const t = useTranslations("commercial");
  const productSelection = useProductSelection();
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
  const selectedQuantity = Math.min(
    quantity,
    variant?.maxPurchaseQuantity ?? Number.MAX_SAFE_INTEGER,
  );

  return (
    <div className="space-y-5">
      <div className="border-border space-y-1 border-b pb-4">
        <p className="font-navigation text-text-black text-2xl">
          {variant &&
          price.amount.trim() &&
          variant.purchaseStatus !== "unpriced"
            ? formatMoney(price, locale)
            : labels.productUnavailable}
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

      {variant?.netContent ? (
        <p className="text-text-primary text-sm">
          {t("netContent", {
            quantity: new Intl.NumberFormat(locale).format(
              variant.netContent.quantity,
            ),
            unit: t(
              variant.netContent.unit === "g"
                ? "g"
                : variant.netContent.unit === "ml"
                  ? "ml"
                  : "unit",
            ),
          })}
        </p>
      ) : null}
      {variant?.salesUnit ? (
        <p className="text-text-primary text-sm">
          {t("salesUnit", { unit: t(variant.salesUnit) })}
        </p>
      ) : null}
      {variant?.purchaseStatus && variant.purchaseStatus !== "available" ? (
        <p role="status" className="text-text-primary text-sm">
          {t(variant.purchaseStatus)}
        </p>
      ) : null}

      {showOptions
        ? product.options.map((option) => {
            const current = selection.find((sel) =>
              sel.optionId
                ? sel.optionId === option.id
                : sel.name === option.name,
            );
            return (
              <fieldset key={option.id || option.name} className="space-y-2">
                <legend className="text-muted text-xs font-medium tracking-[0.14em] uppercase">
                  {option.name}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {(option.choices?.length
                    ? option.choices
                    : option.values.map((value) => ({ id: value, value }))
                  ).map((choice) => {
                    const { value } = choice;
                    const usesIds = Boolean(option.choices?.length);
                    const active = usesIds
                      ? current?.valueId === choice.id
                      : current?.value === value;
                    const candidate = [
                      ...selection.filter((sel) =>
                        sel.optionId
                          ? sel.optionId !== option.id
                          : sel.name !== option.name,
                      ),
                      {
                        name: option.name,
                        value,
                        ...(usesIds
                          ? { optionId: option.id, valueId: choice.id }
                          : {}),
                      },
                    ];
                    return (
                      <Button
                        key={choice.id}
                        type="button"
                        variant={active ? "primary" : "secondary"}
                        aria-pressed={active}
                        disabled={isMutating}
                        className="min-w-20 rounded-lg px-4 normal-case"
                        onClick={() => {
                          setSelection(candidate);
                          productSelection?.select(
                            findVariant(product, candidate),
                          );
                          setQuantity(1);
                          setMessage(null);
                        }}
                      >
                        {value}
                      </Button>
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
              disabled={selectedQuantity <= 1 || isMutating}
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            >
              <MinusIcon aria-hidden className="mx-auto size-4" />
            </button>
            <span className="min-w-8 text-center tabular-nums">
              {selectedQuantity}
            </span>
            <button
              type="button"
              className="h-11 w-11 rounded-full text-lg disabled:opacity-40"
              aria-label={labels.increase}
              disabled={
                isMutating ||
                selectedQuantity >=
                  (variant?.maxPurchaseQuantity ?? Number.MAX_SAFE_INTEGER)
              }
              onClick={() => setQuantity((value) => value + 1)}
            >
              <PlusIcon aria-hidden className="mx-auto size-4" />
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
                quantity: selectedQuantity,
              });
              if (!cart) {
                setMessage(labels.addFailed);
              }
            })();
          }}
        >
          {!available
            ? !variant
              ? labels.productUnavailable
              : labels.soldOut
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
