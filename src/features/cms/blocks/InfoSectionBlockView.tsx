import Image from "next/image";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Eyebrow, SectionTitle } from "@/components/typography";
import type { InfoSectionBlockData } from "@/lib/cms";
import { mediaAlt, resolveMediaUrl } from "@/lib/cms";
import { cn } from "@/lib/utils/cn";
import { CmsLinkButton } from "../CmsLink";
import { RichText } from "../RichText";

export function InfoSectionBlockView({
  block,
  locale,
}: {
  block: InfoSectionBlockData;
  locale: string;
}) {
  const imageUrl = resolveMediaUrl(block.media);
  const layout = block.layout ?? "textMedia";
  const centered = layout === "centered" || !imageUrl;

  return (
    <Section spacing="lg" tone="muted">
      <Container
        className={cn(
          !centered && "grid items-center gap-10 lg:grid-cols-2",
          centered && "max-w-3xl text-center",
        )}
      >
        {imageUrl && layout === "mediaText" ? (
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
            <Image
              src={imageUrl}
              alt={mediaAlt(block.media, block.title)}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        ) : null}

        <div className={cn("space-y-4", centered && "mx-auto")}>
          {block.eyebrow ? <Eyebrow>{block.eyebrow}</Eyebrow> : null}
          <SectionTitle>{block.title}</SectionTitle>
          <RichText value={block.body} className={centered ? "mx-auto" : undefined} />
          <CmsLinkButton link={block.link} locale={locale} />
        </div>

        {imageUrl && layout === "textMedia" ? (
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
            <Image
              src={imageUrl}
              alt={mediaAlt(block.media, block.title)}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        ) : null}
      </Container>
    </Section>
  );
}
