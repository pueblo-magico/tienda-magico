import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Body, Eyebrow, PageTitle } from "@/components/typography";
import { CheckoutStart } from "@/features/checkout/CheckoutStart";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cart?: string }>;
};

export default async function CheckoutPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const query = await searchParams;
  const t = await getTranslations("checkout");

  return (
    <Section spacing="lg">
      <Container className="space-y-8">
        <div className="mx-auto max-w-xl space-y-3 text-center">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <PageTitle as="h1" className="text-4xl sm:text-5xl">
            {t("startTitle")}
          </PageTitle>
          <Body className="text-muted">{t("startBody")}</Body>
        </div>

        <Suspense
          fallback={
            <p className="text-center text-sm text-muted">{t("redirecting")}</p>
          }
        >
          <CheckoutStart initialCartId={query.cart ?? null} />
        </Suspense>
      </Container>
    </Section>
  );
}
