import Image from "next/image";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SectionTitle } from "@/components/typography";
import type { GalleryBlockData } from "@/lib/cms";
import { mediaAlt, resolveMediaUrl } from "@/lib/cms";
import { cn } from "@/lib/utils/cn";

export function GalleryBlockView({ block }: { block: GalleryBlockData }) {
  const cols = block.columns ?? "3";
  const images = (block.images ?? [])
    .map((item, index) => ({
      key: index,
      url: resolveMediaUrl(item.image),
      alt: mediaAlt(item.image, item.caption ?? block.title ?? "Gallery image"),
      caption: item.caption,
    }))
    .filter((item) => item.url);

  if (!images.length) return null;

  return (
    <Section spacing="md">
      <Container className="space-y-8">
        {block.title ? <SectionTitle>{block.title}</SectionTitle> : null}
        <ul
          className={cn(
            "grid gap-4",
            cols === "2" && "sm:grid-cols-2",
            cols === "3" && "sm:grid-cols-2 lg:grid-cols-3",
            cols === "4" && "sm:grid-cols-2 lg:grid-cols-4",
          )}
        >
          {images.map((image) => (
            <li key={image.key} className="space-y-2">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-sand/40">
                <Image
                  src={image.url!}
                  alt={image.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
              {image.caption ? (
                <p className="text-sm text-muted">{image.caption}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
