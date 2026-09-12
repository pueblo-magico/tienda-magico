import Image from "next/image";
import Link from "next/link";
import { localizePath } from "@/config/navigation";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Body, Eyebrow, SectionTitle } from "@/components/typography";
import { commerce } from "@/lib/commerce";
import type { FeaturedCategoriesBlockData } from "@/lib/cms";
import type { CategoryIcon as CategoryIconName, CollectionSummary } from "@/types/commerce";
import { CategoryIcon } from "@/components/CategoryIcon";

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

export async function FeaturedCategoriesBlockView({
  block,
  locale,
}: {
  block: FeaturedCategoriesBlockData;
  locale: string;
}) {
  if (!commerce.isConfigured()) return null;

  const limit = block.limit ?? 4;
  let categories: CollectionSummary[] = [];

  try {
    const listed = await commerce.getCollections({ first: 24, locale });

    if (block.selection === "manual" && block.categories?.length) {
      const wantedIds = new Set(
        block.categories.map((ref) => refId(ref)).filter(Boolean) as string[],
      );
      const wantedSlugs = new Set(
        block.categories
          .map((ref) => refSlug(ref))
          .filter((slug): slug is string => Boolean(slug)),
      );

      categories = listed.items
        .filter(
          (item) => wantedIds.has(item.id) || wantedSlugs.has(item.handle),
        )
        .slice(0, limit);

      if (!categories.length && wantedSlugs.size) {
        for (const handle of wantedSlugs) {
          const collection = await commerce.getCollection(handle, {
            productsFirst: 1,
            locale,
          });
          if (collection) {
            categories.push({
              id: collection.id,
              handle: collection.handle,
              title: collection.title,
              description: collection.description,
              image: collection.image,
              icon: collection.icon,
              parent: collection.parent,
              displayOrder: collection.displayOrder,
            });
          }
          if (categories.length >= limit) break;
        }
      }
    } else {
      categories = listed.items.slice(0, limit);
    }
  } catch {
    return null;
  }

  if (!categories.length) return null;

  return (
    <Section spacing="md">
      <Container className="space-y-8">
        <div className="max-w-2xl space-y-3">
          {block.eyebrow ? <Eyebrow>{block.eyebrow}</Eyebrow> : null}
          {block.title ? <SectionTitle>{block.title}</SectionTitle> : null}
          {block.description ? <Body>{block.description}</Body> : null}
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={localizePath(
                  locale,
                  `/shop?collection=${encodeURIComponent(category.handle)}`,
                )}
                className="group border-border bg-card block overflow-hidden rounded-2xl border transition-shadow hover:shadow-md"
              >
                <div className="bg-sand/40 relative aspect-[4/3]">
                  {category.image?.url ? (
                    <Image
                      src={category.image.url}
                      alt={category.image.altText || category.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  ) : category.icon ? (
                    <div className="text-text-secondary flex size-full items-center justify-center">
                      <CategoryIcon name={category.icon as CategoryIconName} />
                    </div>
                  ) : null}
                </div>
                <div className="space-y-1 px-4 py-3">
                  <h3 className="text-forest font-serif text-lg">
                    {category.title}
                  </h3>
                  {category.description ? (
                    <p className="text-muted line-clamp-2 text-sm">
                      {category.description}
                    </p>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
