import Link from "next/link";
import Image from "next/image";
import { localizePath } from "@/config/navigation";
import { Badge } from "@/components/ui/Badge";
import { Accordion } from "@/components/ui/Accordion";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Body, Eyebrow, PageTitle } from "@/components/typography";
import { RichText } from "@/components/typography/RichText";
import {
  LockKeyIcon,
  PlantIcon,
  TruckIcon,
} from "@phosphor-icons/react/dist/ssr";
import type {
  CategoryReference,
  Product,
  ProductSummary,
} from "@/types/commerce";
import { AddToCartForm } from "./AddToCartForm";
import { ProductGallery } from "./ProductGallery";
import { RelatedProducts } from "./RelatedProducts";
import { getGalleryImages, getDefaultVariant } from "./utils";
import { ProductSelection } from "./ProductSelection";

type Labels = {
  backToShop: string;
  gallery: string;
  noMedia: string;
  mediaError: string;
  retryMedia: string;
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
  originCountry: string;
  originRegion: string;
  originCommunity: string;
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
  // Los proveedores sin resumen separado conservan su presentación anterior.
  const shortDescription =
    product.shortDescription ??
    (product.description.length > 280
      ? `${product.description.slice(0, 277)}…`
      : product.description);
  const images = getGalleryImages(product);
  const classification = product.classification;
  const categoryPath: CategoryReference[] = [];
  let category = classification?.primaryCategory ?? null;
  while (category) {
    categoryPath.unshift(category);
    category = category.parent;
  }
  const publicTags = classification?.tags ?? [];
  const origin = product.origin;
  const legacyOriginSection = product.informationSections?.find(
    (section) => section.key === "origin-impact",
  );
  const otherInformationSections = product.informationSections?.filter(
    (section) => section.key !== "origin-impact",
  );
  const countryName = origin?.countryCode
    ? (() => {
        try {
          return (
            new Intl.DisplayNames([locale], { type: "region" }).of(
              origin.countryCode,
            ) ?? origin.countryCode
          );
        } catch {
          return origin.countryCode;
        }
      })()
    : null;
  const hasOrigin = Boolean(
    countryName || origin?.region || origin?.community || origin?.story,
  );

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

          <ProductSelection
            key={product.updatedAt}
            initialVariant={getDefaultVariant(product)}
          >
            <div className="grid gap-10 lg:grid-cols-[1.08fr_.92fr] lg:items-start">
              <ProductGallery
                title={product.title}
                images={images}
                media={product.media}
                labels={{
                  gallery: labels.gallery,
                  noMedia: labels.noMedia,
                  mediaError: labels.mediaError,
                  retry: labels.retryMedia,
                }}
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
                          className="object-cover"
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
                <PageTitle
                  as="h1"
                  className="text-4xl leading-tight sm:text-5xl"
                >
                  {product.title}
                </PageTitle>

                {publicTags.length || product.tags.length ? (
                  <div
                    className="flex flex-wrap gap-2"
                    aria-label={labels.tags}
                  >
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

                {shortDescription ? (
                  <Body className="text-forest/80">{shortDescription}</Body>
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
                    <TruckIcon
                      aria-hidden
                      className="mx-auto size-4"
                      weight="light"
                    />
                    <strong className="text-text-black mt-1 block font-medium">
                      {labels.freeShipping}
                    </strong>
                  </span>
                  <span>
                    <LockKeyIcon
                      aria-hidden
                      className="mx-auto size-4"
                      weight="light"
                    />
                    <strong className="text-text-black mt-1 block font-medium">
                      {labels.securePayment}
                    </strong>
                  </span>
                  <span>
                    <PlantIcon
                      aria-hidden
                      className="mx-auto size-4"
                      weight="light"
                    />
                    <strong className="text-text-black mt-1 block font-medium">
                      {labels.ethicallySourced}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          </ProductSelection>
          {product.description.trim() ||
          otherInformationSections?.length ||
          legacyOriginSection ||
          hasOrigin ? (
            <Accordion
              className="bg-card rounded-xl"
              items={[
                ...(product.description.trim()
                  ? [
                      {
                        id: "description",
                        title: labels.description,
                        content: product.descriptionContent ? (
                          <RichText html={product.descriptionContent} />
                        ) : (
                          <RichText value={product.description} />
                        ),
                      },
                    ]
                  : []),
                ...(otherInformationSections ?? []).map((section) => ({
                  id: `section-${section.key}`,
                  title: section.title,
                  content: <RichText html={section.content} />,
                })),
                ...(hasOrigin || legacyOriginSection
                  ? [
                      {
                        id: "section-origin-impact",
                        title:
                          legacyOriginSection?.title ?? labels.originImpact,
                        content: (
                          <div className="space-y-4">
                            {countryName ||
                            origin?.region ||
                            origin?.community ? (
                              <dl className="grid gap-3 sm:grid-cols-3">
                                {countryName ? (
                                  <div>
                                    <dt className="text-text-primary text-xs tracking-wide uppercase">
                                      {labels.originCountry}
                                    </dt>
                                    <dd className="text-text-black mt-1">
                                      {countryName}
                                    </dd>
                                  </div>
                                ) : null}
                                {origin?.region ? (
                                  <div>
                                    <dt className="text-text-primary text-xs tracking-wide uppercase">
                                      {labels.originRegion}
                                    </dt>
                                    <dd className="text-text-black mt-1">
                                      {origin.region}
                                    </dd>
                                  </div>
                                ) : null}
                                {origin?.community ? (
                                  <div>
                                    <dt className="text-text-primary text-xs tracking-wide uppercase">
                                      {labels.originCommunity}
                                    </dt>
                                    <dd className="text-text-black mt-1">
                                      {origin.community}
                                    </dd>
                                  </div>
                                ) : null}
                              </dl>
                            ) : null}
                            {origin?.story ? (
                              <RichText html={origin.story} />
                            ) : legacyOriginSection ? (
                              <RichText html={legacyOriginSection.content} />
                            ) : null}
                          </div>
                        ),
                      },
                    ]
                  : []),
              ]}
            />
          ) : null}
        </Container>
      </Section>

      <RelatedProducts
        locale={locale}
        eyebrow={labels.relatedEyebrow}
        title={labels.relatedTitle}
        products={related}
        noMediaLabel={labels.noMedia}
      />
    </>
  );
}
