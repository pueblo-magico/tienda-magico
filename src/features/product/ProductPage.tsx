import Link from "next/link";
import { localizePath } from "@/config/navigation";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Body, Eyebrow, PageTitle } from "@/components/typography";
import type { Product, ProductSummary } from "@/types/commerce";
import { AddToCartForm } from "./AddToCartForm";
import { ProductGallery } from "./ProductGallery";
import { ProductImpact } from "./ProductImpact";
import { ProductStory } from "./ProductStory";
import { RelatedProducts } from "./RelatedProducts";
import { getGalleryImages, impactItemsFromProduct } from "./utils";

type Labels = {
  backToShop: string;
  gallery: string;
  addToCart: string;
  adding: string;
  soldOut: string;
  quantity: string;
  decrease: string;
  increase: string;
  from: string;
  unavailable: string;
  addFailed: string;
  storyEyebrow: string;
  storyTitle: string;
  impactEyebrow: string;
  impactTitle: string;
  relatedEyebrow: string;
  relatedTitle: string;
  tags: string;
};

type Props = {
  locale: string;
  product: Product;
  related: ProductSummary[];
  labels: Labels;
};

export function ProductPageView({ locale, product, related, labels }: Props) {
  const images = getGalleryImages(product);
  const impact = impactItemsFromProduct(product);

  return (
    <>
      <Section spacing="lg">
        <Container className="space-y-8">
          <Link
            href={localizePath(locale, "/shop")}
            className="text-xs font-medium uppercase tracking-[0.14em] text-muted transition-colors hover:text-forest"
          >
            ← {labels.backToShop}
          </Link>

          <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
            <ProductGallery
              title={product.title}
              images={images}
              labels={{ gallery: labels.gallery }}
            />

            <div className="space-y-6 lg:sticky lg:top-28">
              {product.vendor ? <Eyebrow>{product.vendor}</Eyebrow> : null}
              <PageTitle as="h1" className="text-4xl sm:text-5xl">
                {product.title}
              </PageTitle>

              {product.tags?.length ? (
                <div className="flex flex-wrap gap-2" aria-label={labels.tags}>
                  {product.tags.slice(0, 6).map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}

              {product.description ? (
                <Body className="text-forest/80">
                  {product.description.length > 280
                    ? `${product.description.slice(0, 277)}…`
                    : product.description}
                </Body>
              ) : null}

              <AddToCartForm
                product={product}
                labels={{
                  addToCart: labels.addToCart,
                  adding: labels.adding,
                  soldOut: labels.soldOut,
                  quantity: labels.quantity,
                  decrease: labels.decrease,
                  increase: labels.increase,
                  from: labels.from,
                  unavailable: labels.unavailable,
                  addFailed: labels.addFailed,
                }}
              />
            </div>
          </div>
        </Container>
      </Section>

      <ProductStory
        eyebrow={labels.storyEyebrow}
        title={labels.storyTitle}
        descriptionHtml={product.descriptionHtml}
        description={product.description}
      />

      <ProductImpact
        eyebrow={labels.impactEyebrow}
        title={labels.impactTitle}
        items={impact}
      />

      <RelatedProducts
        locale={locale}
        eyebrow={labels.relatedEyebrow}
        title={labels.relatedTitle}
        products={related}
      />
    </>
  );
}
