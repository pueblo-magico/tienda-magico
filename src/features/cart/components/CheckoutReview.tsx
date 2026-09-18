"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeft,
  Banknote,
  Check,
  CreditCard,
  Info,
  LockKeyhole,
  MapPin,
  ShoppingBag,
  Sprout,
  UserRound,
} from "lucide-react";
import { useCart } from "../CartProvider";
import { ReviewCard } from "@/components/cards/ReviewCard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Body, Eyebrow, PageTitle } from "@/components/typography";
import { legalLinks, localizePath } from "@/config/navigation";
import { formatMoney } from "@/lib/commerce/utils/format";
import { checkoutReviewSnapshot } from "@/lib/checkout/review";
import { validateCheckoutCustomer } from "@/lib/checkout/customer";

export function CheckoutReview() {
  const {
    cart,
    isLoading,
    isMutating,
    configured,
    error,
    buyerName,
    buyerEmail,
    identification,
    paymentMethod,
    confirmCheckout,
  } = useCart();
  const t = useTranslations("checkout.review");
  const cartText = useTranslations("cart");
  const locale = useLocale();
  const cartHref = localizePath(locale, "/cart");
  const [acceptedRevision, setAcceptedRevision] = useState<string | null>(null);
  const snapshot = checkoutReviewSnapshot(cart);
  const revision = JSON.stringify([
    snapshot,
    buyerName,
    buyerEmail,
    paymentMethod,
    identification,
  ]);
  const accepted = acceptedRevision === revision;
  let validBuyer = true;
  try {
    validateCheckoutCustomer(
      { name: buyerName, email: buyerEmail, identification },
      locale,
      paymentMethod,
    );
  } catch {
    validBuyer = false;
  }
  const busy = isLoading || isMutating;
  const canConfirm =
    configured &&
    !busy &&
    validBuyer &&
    Boolean(cart.fulfillmentMode) &&
    cart.lines.length > 0 &&
    !cart.lines.some((line) => line.issue);
  const paymentLabel = cartText(
    paymentMethod === "cash"
      ? "cash"
      : paymentMethod === "bank-transfer"
        ? "bankTransfer"
        : "mercadoPago",
  );
  const total = formatMoney(cart.cost.totalAmount, locale);

  if (isLoading) return <p role="status">{cartText("loading")}</p>;
  if (!cart.lines.length)
    return (
      <div className="space-y-4 text-center">
        <Body>{cartText("empty")}</Body>
        <Button href={cartHref}>{t("back")}</Button>
      </div>
    );

  return (
    <div className="space-y-8">
      <header className="mx-auto max-w-4xl space-y-4 text-center">
        <ol
          aria-label={t("progress")}
          className="text-text-secondary flex flex-wrap items-center justify-center gap-4 text-sm sm:gap-8"
        >
          {[t("cart"), t("details"), t("review")].map((label, index) => (
            <li
              key={label}
              aria-current={index === 2 ? "step" : undefined}
              className="flex items-center gap-3"
            >
              <span
                className={
                  index === 2
                    ? "border-forest bg-warm flex size-10 items-center justify-center rounded-full border-2 font-bold"
                    : "bg-forest flex size-10 items-center justify-center rounded-full text-white"
                }
              >
                {index === 2 ? "3" : <Check aria-hidden className="size-5" />}
              </span>
              {label}
              {index < 2 ? (
                <span
                  aria-hidden
                  className="border-border hidden w-12 border-t sm:block"
                />
              ) : null}
            </li>
          ))}
        </ol>
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <PageTitle as="h1" className="text-3xl sm:text-4xl lg:text-5xl">
          {t("title")}
        </PageTitle>
        <Body>{t("description")}</Body>
      </header>
      {error ? (
        <p role="alert" className="bg-warm text-text-black rounded-xl p-4">
          {error}
        </p>
      ) : null}
      {!validBuyer || !configured || !cart.fulfillmentMode ? (
        <p role="alert" className="text-text-black">
          {t("missing")}{" "}
          <Button variant="link" href={cartHref}>
            {t("back")}
          </Button>
        </p>
      ) : null}
      <div className="grid items-start gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <ReviewCard
            title={t("products")}
            description={t("productsHint")}
            icon={<ShoppingBag className="size-9" strokeWidth={1.5} />}
            editHref={cartHref}
            editLabel={t("edit")}
          >
            <ul className="divide-border divide-y">
              {cart.lines.map((line) => {
                const image = line.merchandise.product.featuredImage;
                return (
                  <li
                    key={line.id}
                    className="flex flex-wrap items-center gap-4 py-3"
                  >
                    <div className="bg-warm relative size-16 shrink-0 overflow-hidden rounded-lg">
                      {image?.url ? (
                        <Image
                          src={image.url}
                          alt={image.altText || line.merchandise.product.title}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <ShoppingBag
                          aria-hidden
                          className="text-text-secondary m-4 size-8"
                          strokeWidth={1.5}
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-text-black">
                        {line.merchandise.product.title}
                      </p>
                      <p className="text-text-primary text-sm">
                        {line.merchandise.selectedOptions
                          .map((option) => option.value)
                          .join(" · ")}
                      </p>
                      {line.issue ? (
                        <p className="text-text-black text-sm">
                          {t("changed")}
                        </p>
                      ) : null}
                    </div>
                    <p className="text-text-black text-right">
                      {line.quantity} ×{" "}
                      {formatMoney(line.cost.amountPerQuantity, locale)}
                    </p>
                  </li>
                );
              })}
            </ul>
          </ReviewCard>
          <ReviewCard
            title={t("buyer")}
            icon={<UserRound className="size-9" strokeWidth={1.5} />}
            editHref={cartHref}
            editLabel={t("edit")}
          >
            <p>{buyerName}</p>
            <p className="text-text-primary break-all">{buyerEmail}</p>
          </ReviewCard>
          <ReviewCard
            title={t("fulfillment")}
            description={t("fulfillmentHint")}
            icon={<MapPin className="size-9" strokeWidth={1.5} />}
            editHref={cartHref}
            editLabel={t("edit")}
          >
            <h3 className="text-text-secondary font-serif text-xl">
              {cartText(
                cart.fulfillmentMode === "local_collection"
                  ? "localCollection"
                  : "delivery",
              )}
            </h3>
            <Body size="sm">
              {cartText(
                cart.fulfillmentMode === "local_collection"
                  ? "localCollectionHint"
                  : "deliveryHint",
              )}
            </Body>
          </ReviewCard>
          <ReviewCard
            title={t("payment")}
            description={t("paymentHint")}
            icon={<CreditCard className="size-9" strokeWidth={1.5} />}
            editHref={cartHref}
            editLabel={t("edit")}
          >
            <div className="flex items-start gap-5">
              <div className="bg-warm text-text-secondary rounded-xl p-5">
                {paymentMethod === "cash" ? (
                  <Banknote aria-hidden className="size-12" strokeWidth={1.5} />
                ) : (
                  <CreditCard
                    aria-hidden
                    className="size-12"
                    strokeWidth={1.5}
                  />
                )}
              </div>
              <div className="space-y-3">
                <h3 className="text-text-secondary font-serif text-xl">
                  {paymentLabel}
                </h3>
                <Body size="sm">
                  {t(
                    paymentMethod === "cash"
                      ? "cashHint"
                      : paymentMethod === "bank-transfer"
                        ? "transferHint"
                        : "mercadoHint",
                  )}
                </Body>
                {paymentMethod === "bank-transfer" ? (
                  <p className="text-text-black text-sm">
                    {identification.type}: {identification.number}
                  </p>
                ) : null}
                {paymentMethod !== "mercado-pago" ? (
                  <p className="bg-warm text-text-black flex gap-2 rounded-lg p-3 text-sm">
                    <Info aria-hidden className="size-5 shrink-0" />
                    {t("pendingHint")}
                  </p>
                ) : null}
              </div>
            </div>
          </ReviewCard>
        </div>
        <aside className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle variant="editorial">{t("summary")}</CardTitle>
              <CardDescription>{t("summaryHint")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <dl className="space-y-4">
                <div className="flex justify-between gap-4">
                  <dt>{cartText("subtotal")}</dt>
                  <dd>{formatMoney(cart.cost.subtotalAmount, locale)}</dd>
                </div>
                <div className="bg-warm text-text-secondary flex flex-wrap items-center justify-between gap-3 rounded-lg p-4">
                  <dt className="font-serif text-2xl">{t("total")}</dt>
                  <dd className="text-3xl font-bold">{total}</dd>
                </div>
              </dl>
              <p className="text-text-primary text-sm">
                {cartText("taxesNote")}
              </p>
              <p className="bg-warm text-text-secondary flex items-center gap-4 rounded-lg p-4">
                <Sprout
                  aria-hidden
                  className="size-9 shrink-0"
                  strokeWidth={1.5}
                />
                {t("impact")}
              </p>
              <div className="border-border space-y-3 border-t pt-4">
                <Checkbox
                  isRequired
                  isSelected={accepted}
                  isDisabled={busy}
                  onChange={(value) =>
                    setAcceptedRevision(value ? revision : null)
                  }
                >
                  {t("accept")}
                </Checkbox>
                <a
                  href={legalLinks.terms}
                  target="_blank"
                  rel="noreferrer"
                  className="text-text-secondary block text-sm underline"
                >
                  {t("terms")}
                </a>
                <a
                  href={legalLinks.privacy}
                  target="_blank"
                  rel="noreferrer"
                  className="text-text-secondary block text-sm underline"
                >
                  {t("privacy")}
                </a>
              </div>
              <Button
                className="w-full"
                size="lg"
                shape="rounded"
                disabled={!accepted || !canConfirm}
                aria-busy={isMutating}
                onClick={() => confirmCheckout(accepted, snapshot)}
              >
                {t(isMutating ? "confirming" : "confirm", { amount: total })}
              </Button>
              <p className="text-text-primary flex items-center justify-center gap-3 text-sm">
                <LockKeyhole aria-hidden className="size-5 shrink-0" />
                {t("secure")}
              </p>
            </CardContent>
          </Card>
          <Button href={cartHref} variant="link">
            <ArrowLeft aria-hidden className="size-5" />
            {t("back")}
          </Button>
        </aside>
      </div>
    </div>
  );
}
