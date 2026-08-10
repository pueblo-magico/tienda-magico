import { Accordion } from "@/components/ui/Accordion";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Eyebrow, SectionTitle } from "@/components/typography";
import type { CmsFaq, FaqBlockData } from "@/lib/cms";
import { getFaqs, richTextToPlain } from "@/lib/cms";
import { RichText } from "../RichText";

function asFaq(value: unknown): CmsFaq | null {
  if (!value || typeof value !== "object") return null;
  const item = value as CmsFaq;
  if (!item.question) return null;
  return item;
}

export async function FaqBlockView({
  block,
  locale,
}: {
  block: FaqBlockData;
  locale: string;
}) {
  let items: CmsFaq[] = [];

  if (block.selection === "manual" && block.items?.length) {
    items = block.items
      .map((item) => asFaq(item))
      .filter((item): item is CmsFaq => Boolean(item));

    if (!items.length) {
      const ids = block.items
        .map((item) =>
          typeof item === "object" && item && "id" in item
            ? (item as { id: string | number }).id
            : item,
        )
        .filter((id) => typeof id === "string" || typeof id === "number");
      items = await getFaqs({ locale, ids, limit: ids.length });
    }
  } else if (block.selection === "category" && block.category) {
    items = await getFaqs({ locale, category: block.category, limit: 20 });
  } else {
    items = await getFaqs({ locale, limit: 20 });
  }

  if (!items.length) return null;

  return (
    <Section spacing="md">
      <Container className="mx-auto max-w-3xl space-y-8">
        <div className="space-y-3 text-center">
          {block.eyebrow ? <Eyebrow>{block.eyebrow}</Eyebrow> : null}
          {block.title ? <SectionTitle>{block.title}</SectionTitle> : null}
        </div>
        <Accordion
          items={items.map((item) => ({
            id: String(item.id),
            title: item.question,
            content: item.answer ? (
              <RichText value={item.answer} />
            ) : (
              richTextToPlain(item.answer)
            ),
          }))}
        />
      </Container>
    </Section>
  );
}
