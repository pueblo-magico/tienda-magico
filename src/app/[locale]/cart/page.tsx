import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Body, PageTitle } from "@/components/typography";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function CartPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("cart");

  return (
    <Section>
      <Container className="max-w-2xl space-y-4">
        <PageTitle as="h1" className="text-4xl sm:text-5xl">
          {t("title")}
        </PageTitle>
        <Body>{t("empty")}</Body>
        <Button href={`/${locale}/shop`} variant="secondary">
          {t("continue")}
        </Button>
      </Container>
    </Section>
  );
}
