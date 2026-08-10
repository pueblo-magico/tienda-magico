import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Body, Eyebrow, SectionTitle } from "@/components/typography";
import type { CtaBlockData } from "@/lib/cms";
import { cn } from "@/lib/utils/cn";
import { CmsLinkButton } from "../CmsLink";

export function CtaBlockView({
  block,
  locale,
}: {
  block: CtaBlockData;
  locale: string;
}) {
  const style = block.style ?? "brand";

  return (
    <Section spacing="md">
      <Container>
        <div
          className={cn(
            "rounded-3xl px-6 py-10 sm:px-10",
            style === "brand" && "bg-forest text-brand-foreground",
            style === "sand" && "bg-sand/50 text-forest",
            style === "outline" && "border border-border bg-card text-forest",
          )}
        >
          <div className="mx-auto flex max-w-2xl flex-col items-start gap-4 text-left">
            {block.eyebrow ? (
              <Eyebrow
                className={style === "brand" ? "text-brand-foreground/70" : undefined}
              >
                {block.eyebrow}
              </Eyebrow>
            ) : null}
            <SectionTitle
              className={style === "brand" ? "text-brand-foreground" : undefined}
            >
              {block.title}
            </SectionTitle>
            {block.description ? (
              <Body
                className={
                  style === "brand" ? "text-brand-foreground/85" : undefined
                }
              >
                {block.description}
              </Body>
            ) : null}
            {block.actions?.length ? (
              <div className="flex flex-wrap gap-3 pt-2">
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
      </Container>
    </Section>
  );
}
