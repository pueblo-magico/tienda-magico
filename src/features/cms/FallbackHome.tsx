import { Button } from "@/components/ui/Button";
import { localizePath } from "@/config/navigation";
import { ImpactCard } from "@/components/cards/ImpactCard";
import { ProductCard } from "@/components/cards/ProductCard";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Body, Eyebrow, PageTitle, SectionTitle } from "@/components/typography";
import { commerce, formatMoney } from "@/lib/commerce";
import { getTranslations } from "next-intl/server";

/**
 * Used when CMS is offline or the `home` page is missing.
 * Keeps Phase 7 section structure with next-intl + optional commerce data.
 */
export async function FallbackHome({ locale }: { locale: string }) {
  const t = await getTranslations("home");
  const tSections = await getTranslations("homeSections");

  let products: Awaited<ReturnType<typeof commerce.getProducts>>["items"] = [];
  let categories: Awaited<
    ReturnType<typeof commerce.getCollections>
  >["items"] = [];

  if (commerce.isConfigured()) {
    try {
      const [productPage, collectionPage] = await Promise.all([
        commerce.getProducts({ first: 4, locale }),
        commerce.getCollections({ first: 4, locale }),
      ]);
      products = productPage.items;
      categories = collectionPage.items;
    } catch {
      // keep empty — UI still renders static sections
    }
  }

  return (
    <>
      <Section spacing="lg">
        <Container className="flex max-w-3xl flex-col items-start gap-6">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <PageTitle>{t("title")}</PageTitle>
          <Body size="lg">{t("subtitle")}</Body>
          <div className="flex flex-wrap gap-3">
            <Button href={localizePath(locale, "/shop")}>{t("cta")}</Button>
            <Button href={`/${locale}/impact`} variant="secondary">
              {t("secondaryCta")}
            </Button>
          </div>
        </Container>
      </Section>

      {categories.length ? (
        <Section spacing="md">
          <Container className="space-y-8">
            <div className="space-y-3">
              <Eyebrow>{tSections("categoriesEyebrow")}</Eyebrow>
              <SectionTitle>{tSections("categoriesTitle")}</SectionTitle>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((category) => (
                <li key={category.id}>
                  <a
                    href={localizePath(locale, `/shop?collection=${encodeURIComponent(category.handle)}`)}
                    className="block rounded-2xl border border-border bg-card px-4 py-5 transition-shadow hover:shadow-md"
                  >
                    <h3 className="font-serif text-lg text-forest">
                      {category.title}
                    </h3>
                    {category.description ? (
                      <p className="mt-1 line-clamp-2 text-sm text-muted">
                        {category.description}
                      </p>
                    ) : null}
                  </a>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      {products.length ? (
        <Section spacing="md">
          <Container className="space-y-8">
            <div className="space-y-3">
              <Eyebrow>{tSections("bestsellersEyebrow")}</Eyebrow>
              <SectionTitle>{tSections("bestsellersTitle")}</SectionTitle>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <li key={product.id}>
                  <ProductCard
                    href={localizePath(locale, `/shop/${product.handle}`)}
                    title={product.title}
                    price={formatMoney(
                      product.priceRange.minVariantPrice,
                      locale,
                    )}
                    imageSrc={
                      product.featuredImage?.url ||
                      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80"
                    }
                    imageAlt={product.featuredImage?.altText || product.title}
                  />
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      <Section spacing="lg" tone="muted">
        <Container className="mx-auto max-w-3xl space-y-4 text-center">
          <Eyebrow>{tSections("storyEyebrow")}</Eyebrow>
          <SectionTitle>{tSections("storyTitle")}</SectionTitle>
          <Body>{tSections("storyBody")}</Body>
          <Button href={`/${locale}/about`} variant="secondary">
            {tSections("storyCta")}
          </Button>
        </Container>
      </Section>

      <Section spacing="md">
        <Container className="space-y-8">
          <div className="mx-auto max-w-2xl space-y-3 text-center">
            <Eyebrow>{tSections("impactEyebrow")}</Eyebrow>
            <SectionTitle>{tSections("impactTitle")}</SectionTitle>
          </div>
          <ul className="grid gap-4 sm:grid-cols-3">
            <li>
              <ImpactCard
                value={tSections("impact1Value")}
                label={tSections("impact1Label")}
                description={tSections("impact1Description")}
              />
            </li>
            <li>
              <ImpactCard
                value={tSections("impact2Value")}
                label={tSections("impact2Label")}
                description={tSections("impact2Description")}
              />
            </li>
            <li>
              <ImpactCard
                value={tSections("impact3Value")}
                label={tSections("impact3Label")}
                description={tSections("impact3Description")}
              />
            </li>
          </ul>
        </Container>
      </Section>

      <Section spacing="md">
        <Container>
          <div className="rounded-3xl border border-border bg-card px-6 py-10 text-center sm:px-10">
            <Eyebrow>{tSections("newsletterEyebrow")}</Eyebrow>
            <SectionTitle className="mt-3">{tSections("newsletterTitle")}</SectionTitle>
            <Body className="mx-auto mt-3 max-w-lg">
              {tSections("newsletterBody")}
            </Body>
            <p className="mt-4 text-sm text-muted">{tSections("newsletterHint")}</p>
          </div>
        </Container>
      </Section>
    </>
  );
}
