import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Eyebrow, SectionTitle } from "@/components/typography";
import { RichText } from "@/components/typography/RichText";
import type { SafeRichTextHtml } from "@/types/content";

type Props = {
  title: string;
  eyebrow: string;
  descriptionHtml?: SafeRichTextHtml;
  description?: string;
};

export function ProductStory({
  title,
  eyebrow,
  descriptionHtml,
  description,
}: Props) {
  const html = descriptionHtml;
  const text = description?.trim();
  if (!html && !text) return null;

  return (
    <Section spacing="md" tone="muted">
      <Container className="mx-auto max-w-3xl space-y-4">
        <Eyebrow>{eyebrow}</Eyebrow>
        <SectionTitle>{title}</SectionTitle>
        {html ? <RichText html={html} /> : <RichText value={text} />}
      </Container>
    </Section>
  );
}
