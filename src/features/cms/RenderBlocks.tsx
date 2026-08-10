import type {
  CmsLayoutBlock,
  CtaBlockData,
  FaqBlockData,
  FeaturedCategoriesBlockData,
  FeaturedProductsBlockData,
  GalleryBlockData,
  HeroBlockData,
  ImpactStatsBlockData,
  InfoSectionBlockData,
  NewsletterBlockData,
  TestimonialsBlockData,
} from "@/lib/cms";
import { CtaBlockView } from "./blocks/CtaBlockView";
import { FaqBlockView } from "./blocks/FaqBlockView";
import { FeaturedCategoriesBlockView } from "./blocks/FeaturedCategoriesBlockView";
import { FeaturedProductsBlockView } from "./blocks/FeaturedProductsBlockView";
import { GalleryBlockView } from "./blocks/GalleryBlockView";
import { HeroBlockView } from "./blocks/HeroBlockView";
import { ImpactStatsBlockView } from "./blocks/ImpactStatsBlockView";
import { InfoSectionBlockView } from "./blocks/InfoSectionBlockView";
import { NewsletterBlockView } from "./blocks/NewsletterBlockView";
import { TestimonialsBlockView } from "./blocks/TestimonialsBlockView";

export async function RenderBlocks({
  blocks,
  locale,
}: {
  blocks: CmsLayoutBlock[] | null | undefined;
  locale: string;
}) {
  if (!blocks?.length) return null;

  return (
    <>
      {blocks.map((block, index) => {
        const key = block.id ?? `${block.blockType}-${index}`;

        switch (block.blockType) {
          case "hero":
            return (
              <HeroBlockView
                key={key}
                block={block as HeroBlockData}
                locale={locale}
              />
            );
          case "cta":
            return (
              <CtaBlockView
                key={key}
                block={block as CtaBlockData}
                locale={locale}
              />
            );
          case "infoSection":
            return (
              <InfoSectionBlockView
                key={key}
                block={block as InfoSectionBlockData}
                locale={locale}
              />
            );
          case "gallery":
            return (
              <GalleryBlockView key={key} block={block as GalleryBlockData} />
            );
          case "testimonials":
            return (
              <TestimonialsBlockView
                key={key}
                block={block as TestimonialsBlockData}
                locale={locale}
              />
            );
          case "faq":
            return (
              <FaqBlockView
                key={key}
                block={block as FaqBlockData}
                locale={locale}
              />
            );
          case "newsletter":
            return (
              <NewsletterBlockView
                key={key}
                block={block as NewsletterBlockData}
              />
            );
          case "featuredProducts":
            return (
              <FeaturedProductsBlockView
                key={key}
                block={block as FeaturedProductsBlockData}
                locale={locale}
              />
            );
          case "featuredCategories":
            return (
              <FeaturedCategoriesBlockView
                key={key}
                block={block as FeaturedCategoriesBlockData}
                locale={locale}
              />
            );
          case "impactStats":
            return (
              <ImpactStatsBlockView
                key={key}
                block={block as ImpactStatsBlockData}
              />
            );
          default:
            return null;
        }
      })}
    </>
  );
}
