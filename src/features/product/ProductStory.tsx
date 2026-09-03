import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Eyebrow, SectionTitle } from "@/components/typography";
import { cn } from "@/lib/utils/cn";

type Props = {
  title: string;
  eyebrow: string;
  descriptionHtml?: string;
  description?: string;
};

export function ProductStory({
  title,
  eyebrow,
  descriptionHtml,
  description,
}: Props) {
  const html = descriptionHtml?.trim();
  const text = description?.trim();
  if (!html && !text) return null;

  return (
    <Section spacing="md" tone="muted">
      <Container className="mx-auto max-w-3xl space-y-4">
        <Eyebrow>{eyebrow}</Eyebrow>
        <SectionTitle>{title}</SectionTitle>
        {html ? (
          <div
            className={cn(
              "prose prose-forest text-forest/85 max-w-none text-base leading-relaxed",
              "prose-headings:font-serif prose-headings:font-normal prose-a:text-brand",
            )}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <p className="text-forest/85 text-base leading-relaxed whitespace-pre-line">
            {text}
          </p>
        )}
      </Container>
    </Section>
  );
}
