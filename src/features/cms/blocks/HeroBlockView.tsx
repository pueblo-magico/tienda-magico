import Image from "next/image";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Body, Eyebrow, PageTitle } from "@/components/typography";
import type { HeroBlockData } from "@/lib/cms";
import { mediaAlt, resolveMediaUrl } from "@/lib/cms";
import { CmsLinkButton } from "../CmsLink";
import { RichText } from "../RichText";

export function HeroBlockView({
  block,
  locale,
}: {
  block: HeroBlockData;
  locale: string;
}) {
  const imageUrl = resolveMediaUrl(block.media);
  const position = block.mediaPosition ?? "right";
  const isBackground = position === "background" && imageUrl;

  return (
    <Section
      spacing="lg"
      className={isBackground ? "relative overflow-hidden" : undefined}
      tone={isBackground ? "inverse" : "default"}
    >
      {isBackground ? (
        <Image
          src={imageUrl}
          alt={mediaAlt(block.media, block.title)}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      ) : null}
      {isBackground ? (
        <div className="absolute inset-0 bg-forest/55" aria-hidden />
      ) : null}

      <Container
        className={
          position === "right" || position === "left"
            ? "relative grid items-center gap-10 lg:grid-cols-2"
            : "relative max-w-3xl"
        }
      >
        <div
          className={
            position === "left" ? "order-2 lg:order-2" : "order-1 space-y-5"
          }
        >
          <div className="space-y-5">
            {block.eyebrow ? <Eyebrow>{block.eyebrow}</Eyebrow> : null}
            <PageTitle className={isBackground ? "text-brand-foreground" : undefined}>
              {block.title}
            </PageTitle>
            {block.subtitle ? (
              <Body
                size="lg"
                className={isBackground ? "text-brand-foreground/90" : undefined}
              >
                {block.subtitle}
              </Body>
            ) : null}
            <RichText
              value={block.body}
              className={isBackground ? "text-brand-foreground/90" : undefined}
            />
            {block.actions?.length ? (
              <div className="flex flex-wrap gap-3 pt-1">
                {block.actions.map((item, index) => (
                  <CmsLinkButton
                    key={item.link?.label ?? index}
                    link={item.link}
                    locale={locale}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {imageUrl && (position === "right" || position === "left") ? (
          <div
            className={
              position === "left"
                ? "relative order-1 aspect-[4/5] overflow-hidden rounded-3xl lg:order-1"
                : "relative aspect-[4/5] overflow-hidden rounded-3xl"
            }
          >
            <Image
              src={imageUrl}
              alt={mediaAlt(block.media, block.title)}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        ) : null}
      </Container>
    </Section>
  );
}
