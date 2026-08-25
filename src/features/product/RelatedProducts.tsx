import { ProductCard } from "@/components/cards/ProductCard";
import { localizePath } from "@/config/navigation";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Eyebrow, SectionTitle } from "@/components/typography";
import { formatMoney } from "@/lib/commerce/utils/format";
import type { ProductSummary } from "@/types/commerce";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80";

type Props = {
  locale: string;
  eyebrow: string;
  title: string;
  products: ProductSummary[];
};

export function RelatedProducts({ locale, eyebrow, title, products }: Props) {
  if (!products.length) return null;

  return (
    <Section spacing="md" tone="muted">
      <Container className="space-y-8">
        <div className="space-y-3">
          <Eyebrow>{eyebrow}</Eyebrow>
          <SectionTitle>{title}</SectionTitle>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard
                href={localizePath(locale, `/shop/${product.handle}`)}
                title={product.title}
                price={formatMoney(product.priceRange.minVariantPrice, locale)}
                imageSrc={product.featuredImage?.url || PLACEHOLDER}
                imageAlt={product.featuredImage?.altText || product.title}
              />
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
