import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Body, Eyebrow, PageTitle } from "@/components/typography";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <Section spacing="lg">
      <Container className="flex max-w-3xl flex-col items-start gap-6">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <PageTitle>{t("title")}</PageTitle>
        <Body size="lg">{t("subtitle")}</Body>
        <div className="flex flex-wrap gap-3">
          <Button href={`/${locale}/shop`}>{t("cta")}</Button>
          <Button href={`/${locale}/impact`} variant="secondary">
            {t("secondaryCta")}
          </Button>
          <Button href="/ui-system" variant="ghost">
            {t("designSystem")}
          </Button>
        </div>
      </Container>
    </Section>
  );
}
