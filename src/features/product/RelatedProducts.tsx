import { ProductCard } from "@/components/cards/ProductCard";
import { localizePath } from "@/config/navigation";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { Eyebrow, SectionTitle } from "@/components/typography";
import { formatMoney } from "@/lib/commerce/utils/format";
import type { ProductSummary } from "@/types/commerce";
import { useTranslations } from "next-intl";

type Props = {
  locale: string;
  eyebrow: string;
  title: string;
  products: ProductSummary[];
  noMediaLabel: string;
};

export function RelatedProducts({
  locale,
  eyebrow,
  title,
  products,
  noMediaLabel,
}: Props) {
  const t = useTranslations("product");
  if (!products.length) return null;

  return (
    <Section spacing="md" tone="muted">
      <Container className="space-y-8">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-3">
            <Eyebrow>{eyebrow}</Eyebrow>
            <SectionTitle>{title}</SectionTitle>
          </div>
          <Button href={localizePath(locale, "/shop")} variant="link">
            View all →
          </Button>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard
                href={localizePath(locale, `/shop/${product.handle}`)}
                title={product.title}
                price={
                  product.availableForSale
                    ? formatMoney(product.priceRange.minVariantPrice, locale)
                    : t("productUnavailable")
                }
                imageSrc={product.featuredImage?.url}
                imageAlt={product.featuredImage?.altText || product.title}
                noMediaLabel={noMediaLabel}
              />
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
