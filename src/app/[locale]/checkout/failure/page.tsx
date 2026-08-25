import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Body, Eyebrow, PageTitle } from "@/components/typography";
import { Button } from "@/components/ui/Button";
import { localizePath } from "@/config/navigation";
import { checkout } from "@/lib/checkout";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function CheckoutFailurePage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const query = await searchParams;
  const t = await getTranslations("checkout");

  const paymentId = first(query.payment_id) || first(query.collection_id);
  const statusParam = first(query.status) || first(query.collection_status);
  const preferenceId = first(query.preference_id);
  const externalReference = first(query.external_reference);

  let paymentStatus: string | null = null;
  if (paymentId && checkout.provider.getPayment) {
    try {
      const payment = await checkout.getPayment(paymentId);
      paymentStatus = payment?.status ?? null;
    } catch {
      paymentStatus = null;
    }
  }

  return (
    <Section spacing="lg">
      <Container className="mx-auto max-w-xl space-y-6 text-center">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <PageTitle as="h1" className="text-4xl sm:text-5xl">
          {t("failure.title")}
        </PageTitle>
        <Body className="text-forest/80">{t("failure.body")}</Body>

        {paymentId || statusParam || preferenceId || externalReference || paymentStatus ? (
          <dl className="mx-auto max-w-sm space-y-2 rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm text-forest/80">
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

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button href={localizePath(locale, "/shop")}>{t("continueShopping")}</Button>
          <Button href={`/${locale}`} variant="ghost">
            {t("backHome")}
          </Button>
        </div>

        <p className="text-xs text-muted">
          <Link
            href={localizePath(locale, "/cart")}
            className="underline-offset-4 hover:underline"
          >
            {t("backToCart")}
          </Link>
        </p>
      </Container>
    </Section>
  );
}
