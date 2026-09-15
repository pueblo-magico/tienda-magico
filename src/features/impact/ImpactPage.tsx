import { getLocale, getTranslations } from "next-intl/server";
import { ImpactCard, InfoCard } from "@/components/cards";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import {
  Body,
  Eyebrow,
  PageTitle,
  SectionTitle,
} from "@/components/typography";
import { Badge, Button } from "@/components/ui";
import { legalLinks } from "@/config/navigation";
import { getSiteSettings } from "@/lib/cms";
import { ImpactContactForm } from "./ImpactContactForm";

const principleKeys = ["origin", "materials", "purpose"] as const;
const statisticKeys = [
  "communities",
  "regenerative",
  "planet",
  "trees",
  "land",
  "countries",
] as const;

export async function ImpactPage() {
  const locale = await getLocale();
  const [t, siteSettings] = await Promise.all([
    getTranslations("impactPage"),
    getSiteSettings(locale),
  ]);
  const anchors = {
    principles: locale === "es" ? "principios" : "principles",
    results: locale === "es" ? "resultados" : "results",
    contact: locale === "es" ? "contacto" : "contact",
  };
  const interests = ["products", "experiences", "stays"].map((value) => ({
    value,
    label: t(`contact.interests.${value}`),
  }));

  return (
    <main className="bg-background-primary">
      <Section spacing="lg">
        <Container width="narrow" className="text-center">
          <Badge variant="outline">{t("hero.badge")}</Badge>
          <Eyebrow className="text-text-highlight mt-6">
            {t("hero.eyebrow")}
          </Eyebrow>
          <PageTitle className="text-text-secondary mt-3">
            {t("hero.title")}
          </PageTitle>
          <Body size="lg" className="mx-auto mt-5 max-w-2xl">
            {t("hero.description")}
          </Body>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button href={`#${anchors.principles}`}>
              {t("hero.primaryAction")}
            </Button>
            <Button href={`#${anchors.contact}`} variant="secondary">
              {t("hero.secondaryAction")}
            </Button>
          </div>
        </Container>
      </Section>

      <Section id={anchors.principles} tone="inverse" spacing="lg">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow className="text-text-highlight">
              {t("principles.eyebrow")}
            </Eyebrow>
            <SectionTitle tone="inverse" className="mt-3">
              {t("principles.title")}
            </SectionTitle>
            <Body tone="inverse" className="mx-auto mt-4 max-w-2xl">
              {t("principles.description")}
            </Body>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {principleKeys.map((key) => (
              <InfoCard
                key={key}
                tone="inverse"
                eyebrow={t(`principles.items.${key}.eyebrow`)}
                title={t(`principles.items.${key}.title`)}
                description={t(`principles.items.${key}.description`)}
              />
            ))}
          </div>
        </Container>
      </Section>

      <Section id={anchors.results} tone="muted" spacing="lg">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow className="text-text-accent">
              {t("results.eyebrow")}
            </Eyebrow>
            <SectionTitle className="mt-3">{t("results.title")}</SectionTitle>
            <Body className="mt-4">{t("results.description")}</Body>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {statisticKeys.map((key) => (
              <ImpactCard
                key={key}
                value={t(`results.items.${key}.value`)}
                label={t(`results.items.${key}.label`)}
                description={t(`results.items.${key}.description`)}
              />
            ))}
          </div>
        </Container>
      </Section>

      <Section id={anchors.contact} spacing="lg">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <Eyebrow className="text-text-highlight">
                {t("contact.eyebrow")}
              </Eyebrow>
              <SectionTitle className="mt-3">{t("contact.title")}</SectionTitle>
              <Body className="mt-4">{t("contact.description")}</Body>
            </div>
            <ImpactContactForm
              whatsappNumber={siteSettings.contactPhone ?? undefined}
              termsHref={legalLinks.terms}
              privacyHref={legalLinks.privacy}
              interests={interests}
              labels={{
                name: t("contact.name"),
                namePlaceholder: t("contact.namePlaceholder"),
                email: t("contact.email"),
                emailPlaceholder: t("contact.emailPlaceholder"),
                interest: t("contact.interest"),
                interestPlaceholder: t("contact.interestPlaceholder"),
                message: t("contact.message"),
                messagePlaceholder: t("contact.messagePlaceholder"),
                hint: t("contact.hint"),
                submit: t("contact.submit"),
                whatsappIntro: t("contact.whatsappIntro"),
                consentPrefix: t("contact.consentPrefix"),
                consentTerms: t("contact.consentTerms"),
                consentConnector: t("contact.consentConnector"),
                consentPrivacy: t("contact.consentPrivacy"),
                consentSuffix: t("contact.consentSuffix"),
              }}
            />
          </div>
        </Container>
      </Section>
    </main>
  );
}
