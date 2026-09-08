import Link from "next/link";
import Image from "next/image";
import { localizePath } from "@/config/navigation";
import { Badge } from "@/components/ui/Badge";
import { Accordion } from "@/components/ui/Accordion";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Body, Eyebrow, PageTitle } from "@/components/typography";
import type {
  CategoryReference,
  Product,
  ProductSummary,
} from "@/types/commerce";
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
  productUnavailable: string;
  addFailed: string;
  storyEyebrow: string;
  storyTitle: string;
  impactEyebrow: string;
  impactTitle: string;
  relatedEyebrow: string;
  relatedTitle: string;
  tags: string;
  breadcrumb: string;
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
  const classification = product.classification;
  const categoryPath: CategoryReference[] = [];
  let category = classification?.primaryCategory ?? null;
  while (category) {
    categoryPath.unshift(category);
    category = category.parent;
  }
  const publicTags = classification?.tags ?? [];

  return (
    <>
      <Section spacing="md">
        <Container className="space-y-7">
          <nav
            className="text-muted flex flex-wrap items-center gap-2 text-xs"
            aria-label={labels.breadcrumb}
          >
            <Link
              href={localizePath(locale, "/shop")}
              className="hover:text-forest transition-colors"
            >
              {labels.backToShop}
            </Link>
            <span>/</span>
            {categoryPath.map((item) => (
              <span key={item.id} className="contents">
                <Link
                  href={localizePath(
                    locale,
                    `/shop?collection=${encodeURIComponent(item.handle)}`,
                  )}
                  className="hover:text-forest transition-colors"
                >
                  {item.title}
                </Link>
                <span>/</span>
              </span>
            ))}
            <span className="text-text-black">{product.title}</span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-[1.08fr_.92fr] lg:items-start">
            <ProductGallery
              title={product.title}
              images={images}
              labels={{ gallery: labels.gallery }}
            />

            <div className="space-y-6 lg:sticky lg:top-28 lg:pt-4">
              {classification?.brand ? (
                <div className="flex items-center gap-3">
                  {classification.brand.logo?.url ? (
                    <span className="border-border bg-card relative h-10 w-10 overflow-hidden rounded-full border">
                      <Image
                        src={classification.brand.logo.url}
                        alt={
                          classification.brand.logo.altText ||
                          classification.brand.name
                        }
                        fill
                        className="object-contain p-1"
                        sizes="40px"
                      />
                    </span>
                  ) : null}
                  {classification.brand.website ? (
                    <a
                      href={classification.brand.website}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-text-accent transition-colors"
                    >
                      <Eyebrow>{classification.brand.name}</Eyebrow>
                    </a>
                  ) : (
                    <Eyebrow>{classification.brand.name}</Eyebrow>
                  )}
                </div>
              ) : product.vendor ? (
                <Eyebrow>{product.vendor}</Eyebrow>
              ) : null}
              <PageTitle as="h1" className="text-4xl leading-tight sm:text-5xl">
                {product.title}
              </PageTitle>

              {publicTags.length || product.tags.length ? (
                <div className="flex flex-wrap gap-2" aria-label={labels.tags}>
                  {(publicTags.length
                    ? publicTags.map((tag) => ({
                        id: tag.id,
                        label: tag.label,
                      }))
                    : product.tags.map((tag) => ({ id: tag, label: tag }))
                  )
                    .slice(0, 6)
                    .map((tag) => (
                      <Badge key={tag.id} variant="outline">
                        {tag.label}
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
                  productUnavailable: labels.productUnavailable,
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
                content:
                  classification?.primaryCategory?.title ||
                  product.productType ||
                  product.vendor ||
                  "—",
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
