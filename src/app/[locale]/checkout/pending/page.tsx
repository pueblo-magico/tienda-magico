import Link from "next/link";
import { BackdropImage } from "@/components/layout/BackdropImage";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Body, Eyebrow, PageTitle } from "@/components/typography";
import { pendingReturnLink } from "@/features/checkout/pending-navigation";
import { checkout } from "@/lib/checkout";
import { getCommerceSettings, getSiteSettings } from "@/lib/cms";
import { CopyButton } from "@/components/ui/CopyButton";
import { BANK_TRANSFER, CASH } from "@/types/checkout";
import { commerce, formatMoney } from "@/lib/commerce";
import { TransferWaiting } from "@/features/checkout/TransferWaiting";
import { guestCartReferences } from "@/lib/checkout/guest-orders";
import { ArrowLeft } from "lucide-react";
import { CashWaiting } from "@/features/checkout/CashWaiting";
import { ProductCard } from "@/components/cards/ProductCard";
import { Button } from "@/components/ui/Button";
import { localizePath } from "@/config/navigation";
import { OrderSummary } from "@/features/orders/OrderSummary";
import { RefreshPaidCart } from "@/features/cart/RefreshPaidCart";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function CheckoutPendingPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const query = await searchParams;
  const backLink = pendingReturnLink(first(query.from), locale);
  const t = await getTranslations("checkout");
  const ordersText = await getTranslations("orders");

  const paymentId = first(query.payment_id) || first(query.collection_id);
  const statusParam = first(query.status) || first(query.collection_status);
  const preferenceId = first(query.preference_id);
  const externalReference = first(query.external_reference);
  const paymentMethod = first(query.payment_method);
  const orderReference = first(query.order);
  const isBankTransferRequest =
    paymentMethod === BANK_TRANSFER && Boolean(orderReference);
  const isCashRequest = paymentMethod === CASH && Boolean(orderReference);
  const manualOrder =
    (isBankTransferRequest || isCashRequest) && orderReference
      ? await commerce.getCheckoutOrderByPublicReference(orderReference)
      : null;
  const transferOrder =
    manualOrder?.paymentMethod === BANK_TRANSFER ? manualOrder : null;
  const cashOrder = manualOrder?.paymentMethod === CASH ? manualOrder : null;
  const isBankTransfer = transferOrder?.paymentMethod === BANK_TRANSFER;
  const isCash = cashOrder?.paymentMethod === CASH;
  const ownedOrders =
    isBankTransfer || isCash
      ? await commerce.getGuestOrders(await guestCartReferences())
      : [];
  const ownedOrder = ownedOrders.find(
    (order) => order.publicReference === orderReference,
  );
  const commerceSettings =
    isBankTransfer || isCash ? await getCommerceSettings() : null;
  const recommendations =
    isCash && ownedOrder?.paymentStatus === "approved"
      ? await commerce
          .getProducts({ first: 3, locale })
          .then((result) =>
            result.items.filter((product) => product.availableForSale),
          )
          .catch(() => {
            console.warn("No se pudieron cargar las sugerencias del pedido.");
            return [];
          })
      : [];
  const siteSettings =
    isBankTransfer || isCash ? await getSiteSettings(locale) : null;
  const expiresAt = transferOrder?.paymentExpiresAt ?? null;
  const formattedExpiry = expiresAt
    ? (() => {
        const date = new Date(expiresAt);
        return Number.isNaN(date.getTime())
          ? null
          : new Intl.DateTimeFormat(locale, {
              dateStyle: "short",
              timeStyle: "short",
            }).format(date);
      })()
    : null;
  const displayedOrder = transferOrder ?? cashOrder;
  const formattedAmount = displayedOrder
    ? formatMoney(displayedOrder.total, locale)
    : null;

  let paymentStatus: string | null = null;
  if (!isBankTransferRequest && paymentId && checkout.provider.getPayment) {
    try {
      const payment = await checkout.getPayment(paymentId);
      paymentStatus = payment?.status ?? null;
    } catch {
      paymentStatus = null;
    }
  }

  return (
    <div
      className={isBankTransfer ? "lg:grid lg:grid-cols-3" : "relative isolate"}
    >
      {ownedOrder?.paymentStatus === "approved" ? <RefreshPaidCart /> : null}
      {isCash ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 overflow-hidden"
        >
          <BackdropImage
            src="/images/cash-order-background.png"
            sizes="100vw"
            className="object-top"
          />
        </div>
      ) : null}
      {isBankTransfer ? (
        <aside
          aria-hidden
          className="bg-warm relative hidden min-h-full overflow-hidden lg:block"
        >
          {siteSettings?.shopHeroImage ? (
            <BackdropImage src={siteSettings.shopHeroImage.url} sizes="33vw" />
          ) : null}
        </aside>
      ) : null}
      <Section
        spacing="lg"
        className={
          isBankTransfer ? "lg:col-span-2" : isCash ? "pt-5 sm:pt-6" : undefined
        }
      >
        <Container
          className={
            isCash
              ? "mx-auto max-w-7xl space-y-6 text-left"
              : isBankTransfer
                ? "mx-auto max-w-2xl space-y-6 text-left"
                : "mx-auto max-w-xl space-y-6 text-center"
          }
        >
          {!isCash ? <Eyebrow>{t("eyebrow")}</Eyebrow> : null}
          {!isBankTransfer && !isCash ? (
            <>
              <PageTitle as="h1" className="text-4xl sm:text-5xl">
                {t("pending.title")}
              </PageTitle>
              <Body className="text-forest/80">
                {t(
                  isBankTransferRequest && !transferOrder
                    ? "pending.transferNotFound"
                    : isBankTransfer
                      ? "pending.transferBody"
                      : "pending.body",
                )}
              </Body>
            </>
          ) : null}

          {isCash && !ownedOrder ? (
            <>
              <PageTitle as="h1" className="text-4xl sm:text-5xl">
                {t("pending.title")}
              </PageTitle>
              <Body className="text-forest/80">
                {t("pending.cashNotFound")}
              </Body>
            </>
          ) : null}

          {isBankTransfer && commerceSettings ? (
            <TransferWaiting
              paymentStatus={transferOrder.paymentStatus}
              expiresAt={expiresAt}
              serverTime={Date.now()}
              reference={transferOrder.publicReference}
              receivedAt={ownedOrder?.receivedAt}
              canReport={Boolean(ownedOrder)}
              reportedAt={ownedOrder?.transferReportedAt}
              newerReference={ownedOrder?.newerReference}
              instructions={
                <>
                  <div>
                    <dt className="sr-only">{t("pending.orderReference")}</dt>
                    <dd className="text-text-secondary text-sm">
                      {t("pending.descriptionHint")}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-text-secondary">
                      {t("pending.accountHolder")}
                    </dt>
                    <dd className="text-right font-semibold">
                      {commerceSettings.transfer.accountHolder}
                    </dd>
                  </div>
                  {commerceSettings.transfer.alias ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-text-secondary">
                        {t("pending.alias")}
                      </dt>
                      <dd className="font-mono text-xs">
                        {commerceSettings.transfer.alias}
                      </dd>
                    </div>
                  ) : null}
                  {commerceSettings.transfer.cvu ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-text-secondary">
                        {t("pending.cvu")}
                      </dt>
                      <dd className="font-mono text-xs">
                        {commerceSettings.transfer.cvu}
                      </dd>
                    </div>
                  ) : null}
                </>
              }
            >
              <div className="flex justify-between gap-4">
                <dt className="text-text-secondary">
                  {t("pending.orderReference")}
                </dt>
                <dd className="text-right font-mono text-xs break-all">
                  {transferOrder.publicReference}
                  <CopyButton
                    value={transferOrder.publicReference}
                    label={ordersText("copy")}
                    copiedLabel={ordersText("copied")}
                    errorLabel={ordersText("copyFailed")}
                  />
                </dd>
              </div>
              {formattedAmount ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-text-secondary">
                    {t("pending.orderAmount")}
                  </dt>
                  <dd className="font-semibold">{formattedAmount}</dd>
                </div>
              ) : null}
              {formattedExpiry ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-text-secondary">
                    {t("pending.paymentDeadline")}
                  </dt>
                  <dd>
                    <time dateTime={expiresAt ?? undefined}>
                      {formattedExpiry}
                    </time>
                  </dd>
                </div>
              ) : null}
            </TransferWaiting>
          ) : null}

          {isCash && cashOrder && ownedOrder ? (
            <CashWaiting
              expiresAt={ownedOrder.paymentExpiresAt}
              serverTime={Date.now()}
              feedbackSubmitted={ownedOrder.experienceRating != null}
              summary={<OrderSummary order={ownedOrder} />}
              cashStaffEnabled={commerceSettings?.cashStaffEnabled === true}
              reference={ownedOrder.publicReference}
              receivedAt={ownedOrder.receivedAt}
              paymentStatus={ownedOrder.paymentStatus}
              title={t("pending.cashTitle")}
              body={t("pending.cashBody")}
              notice={t("pending.cashNotice")}
              returnLink={
                <Link
                  href={backLink.href}
                  className="text-text-secondary inline-flex items-center gap-2 underline-offset-4 hover:underline"
                >
                  <ArrowLeft aria-hidden className="size-5" strokeWidth={2} />
                  {t(backLink.labelKey)}
                </Link>
              }
            >
              <div className="space-y-2">
                <dt className="text-text-secondary">
                  {t("pending.orderReference")}
                </dt>
                <dd className="bg-text-primary/10 flex items-center justify-between gap-2 rounded-lg p-3 font-mono text-sm break-all">
                  {cashOrder.publicReference}
                  <CopyButton
                    value={cashOrder.publicReference}
                    label={ordersText("copy")}
                    copiedLabel={ordersText("copied")}
                    errorLabel={ordersText("copyFailed")}
                  />
                </dd>
              </div>
              {formattedAmount ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-text-secondary">
                    {t("pending.orderAmount")}
                  </dt>
                  <dd className="text-text-secondary text-2xl font-bold">
                    {formattedAmount}
                  </dd>
                </div>
              ) : null}
            </CashWaiting>
          ) : null}

          {recommendations.length ? (
            <section className="space-y-4">
              <PageTitle as="h2" className="text-3xl sm:text-4xl lg:text-4xl">
                {t("cashConfirmed.inspiration")}
              </PageTitle>
              <div className="grid gap-4 sm:grid-cols-3">
                {recommendations.map((product) => (
                  <ProductCard
                    key={product.id}
                    title={product.title}
                    href={localizePath(locale, `/shop/${product.handle}`)}
                    price={formatMoney(
                      product.priceRange.minVariantPrice,
                      locale,
                    )}
                    imageSrc={product.featuredImage?.url}
                    imageAlt={product.featuredImage?.altText ?? product.title}
                    noMediaLabel={t("cashConfirmed.noImage")}
                    action={
                      <Button
                        variant="secondary"
                        href={localizePath(locale, `/shop/${product.handle}`)}
                      >
                        {t("cashConfirmed.viewProduct")}
                      </Button>
                    }
                  />
                ))}
              </div>
            </section>
          ) : null}
          {!isBankTransferRequest &&
          (paymentId ||
            statusParam ||
            preferenceId ||
            externalReference ||
            paymentStatus) ? (
            <dl className="border-border bg-card text-forest/80 mx-auto max-w-sm space-y-2 rounded-2xl border px-4 py-3 text-left text-sm">
              {paymentId ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{t("paymentId")}</dt>
                  <dd className="font-mono text-xs">{paymentId}</dd>
                </div>
              ) : null}
              {paymentStatus || statusParam ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{t("status")}</dt>
                  <dd>{paymentStatus || statusParam}</dd>
                </div>
              ) : null}
              {preferenceId ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{t("preferenceId")}</dt>
                  <dd className="font-mono text-xs">{preferenceId}</dd>
                </div>
              ) : null}
              {externalReference ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{t("reference")}</dt>
                  <dd className="max-w-[12rem] truncate font-mono text-xs">
                    {externalReference}
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : null}

          {!(isCash && ownedOrder) ? (
            <p className="text-muted text-xs">
              <Link
                href={backLink.href}
                className="inline-flex items-center gap-2 underline-offset-4 hover:underline"
              >
                <ArrowLeft aria-hidden className="size-4" strokeWidth={2} />
                {t(backLink.labelKey)}
              </Link>
            </p>
          ) : null}
        </Container>
      </Section>
    </div>
  );
}
