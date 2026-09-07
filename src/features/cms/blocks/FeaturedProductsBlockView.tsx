import { ProductCard } from "@/components/cards/ProductCard";
import { localizePath } from "@/config/navigation";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Body, Eyebrow, SectionTitle } from "@/components/typography";
import { commerce, formatMoney } from "@/lib/commerce";
import type { FeaturedProductsBlockData } from "@/lib/cms";
import type { ProductSummary } from "@/types/commerce";

function refId(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  if (typeof value === "object" && value && "id" in value) {
    return String((value as { id: string | number }).id);
  }
  return null;
}

function refSlug(value: unknown): string | null {
  if (value && typeof value === "object" && "slug" in value) {
    const slug = (value as { slug?: unknown }).slug;
    return typeof slug === "string" ? slug : null;
  }
  return null;
}

export async function FeaturedProductsBlockView({
  block,
  locale,
}: {
  block: FeaturedProductsBlockData;
  locale: string;
}) {
  if (!commerce.isConfigured()) return null;

  const limit = block.limit ?? 4;
  let products: ProductSummary[] = [];

  try {
    if (block.selection === "category") {
      const handle = refSlug(block.category);
      if (handle) {
        const collection = await commerce.getCollection(handle, {
          productsFirst: limit,
          locale,
        });
        products = collection?.products.slice(0, limit) ?? [];
      }
    } else if (block.products?.length) {
      const resolved: ProductSummary[] = [];
      for (const ref of block.products.slice(0, limit)) {
        const handle = refSlug(ref);
        if (handle) {
          const product = await commerce.getProduct(handle, { locale });
          if (product) {
            resolved.push({
              id: product.id,
              handle: product.handle,
              title: product.title,
              vendor: product.vendor,
              availableForSale: product.availableForSale,
              featuredImage: product.featuredImage,
              priceRange: product.priceRange,
              tags: product.tags,
              classification: product.classification,
            });
          }
          continue;
        }
        // Payload product ids are not shop handles — fall through to list filter later
        void refId(ref);
      }
      products = resolved;

      if (!products.length) {
        const listed = await commerce.getProducts({ first: 24, locale });
        const wanted = new Set(
          block.products.map((ref) => refId(ref)).filter(Boolean) as string[],
        );
        products = listed.items
          .filter((item) => wanted.has(item.id))
          .slice(0, limit);
      }
    } else {
      const listed = await commerce.getProducts({ first: limit, locale });
      products = listed.items;
    }
  } catch {
    return null;
  }

  if (!products.length) return null;

  return (
    <Section spacing="md">
      <Container className="space-y-8">
        <div className="max-w-2xl space-y-3">
          {block.eyebrow ? <Eyebrow>{block.eyebrow}</Eyebrow> : null}
          {block.title ? <SectionTitle>{block.title}</SectionTitle> : null}
          {block.description ? <Body>{block.description}</Body> : null}
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard
                href={localizePath(locale, `/shop/${product.handle}`)}
                title={product.title}
                price={formatMoney(product.priceRange.minVariantPrice, locale)}
                imageSrc={
                  product.featuredImage?.url ||
                  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80"
                }
                imageAlt={product.featuredImage?.altText || product.title}
                category={product.classification?.primaryCategory?.title}
              />
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
