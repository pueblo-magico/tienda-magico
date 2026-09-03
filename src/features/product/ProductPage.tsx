import Link from "next/link";
import { localizePath } from "@/config/navigation";
import { Badge } from "@/components/ui/Badge";
import { Accordion } from "@/components/ui/Accordion";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Body, Eyebrow, PageTitle } from "@/components/typography";
import type { Product, ProductSummary } from "@/types/commerce";
import { AddToCartForm } from "./AddToCartForm";
import { ProductGallery } from "./ProductGallery";
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
  description: string;
  ingredients: string;
  howToUse: string;
  originImpact: string;
  freeShipping: string;
  securePayment: string;
  ethicallySourced: string;
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
      <Section spacing="md">
        <Container className="space-y-7">
          <nav
            className="text-muted flex flex-wrap items-center gap-2 text-xs"
            aria-label="Breadcrumb"
          >
            <Link
              href={localizePath(locale, "/shop")}
              className="hover:text-forest transition-colors"
            >
              {labels.backToShop}
            </Link>
            <span>/</span>
            {product.productType ? (
              <>
                <span>{product.productType}</span>
                <span>/</span>
              </>
            ) : null}
            <span className="text-text-black">{product.title}</span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-[1.08fr_.92fr] lg:items-start">
            <ProductGallery
              title={product.title}
              images={images}
              labels={{ gallery: labels.gallery }}
            />

            <div className="space-y-6 lg:sticky lg:top-28 lg:pt-4">
              {product.vendor ? <Eyebrow>{product.vendor}</Eyebrow> : null}
              <PageTitle as="h1" className="text-4xl leading-tight sm:text-5xl">
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

              <div className="border-border text-muted grid grid-cols-3 gap-3 border-y py-5 text-center text-[11px] leading-snug">
                <span>
                  ♧
                  <strong className="text-text-black mt-1 block font-medium">
                    {labels.freeShipping}
                  </strong>
                </span>
                <span>
                  ♙
                  <strong className="text-text-black mt-1 block font-medium">
                    {labels.securePayment}
                  </strong>
                </span>
                <span>
                  ◇
                  <strong className="text-text-black mt-1 block font-medium">
                    {labels.ethicallySourced}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          <Accordion
            className="bg-card rounded-xl"
            items={[
              {
                id: "description",
                title: labels.description,
                content: product.description || "—",
              },
              {
                id: "ingredients",
                title: labels.ingredients,
                content: product.tags.length ? product.tags.join(" · ") : "—",
              },
              {
                id: "use",
                title: labels.howToUse,
                content: product.productType || product.vendor || "—",
              },
              {
                id: "impact",
                title: labels.originImpact,
                content: impact.length
                  ? impact
                      .map((item) => `${item.value} ${item.label}`)
                      .join(" · ")
                  : product.vendor || "Pueblo Mágico",
              },
            ]}
          />
        </Container>
      </Section>

      <RelatedProducts
        locale={locale}
        eyebrow={labels.relatedEyebrow}
        title={labels.relatedTitle}
        products={related}
      />
    </>
  );
}
