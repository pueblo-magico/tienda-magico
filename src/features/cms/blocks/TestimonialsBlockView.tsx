import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Body, Eyebrow, SectionTitle } from "@/components/typography";
import type { CmsTestimonial, TestimonialsBlockData } from "@/lib/cms";
import { getTestimonials } from "@/lib/cms";

function asTestimonial(value: unknown): CmsTestimonial | null {
  if (!value || typeof value !== "object") return null;
  const item = value as CmsTestimonial;
  if (!item.quote || !item.name) return null;
  return item;
}

export async function TestimonialsBlockView({
  block,
  locale,
}: {
  block: TestimonialsBlockData;
  locale: string;
}) {
  let items: CmsTestimonial[] = [];

  if (block.selection === "manual" && block.items?.length) {
    items = block.items
      .map((item) => asTestimonial(item))
      .filter((item): item is CmsTestimonial => Boolean(item));

    if (!items.length) {
      const ids = block.items
        .map((item) =>
          typeof item === "object" && item && "id" in item
            ? (item as { id: string | number }).id
            : item,
        )
        .filter((id) => typeof id === "string" || typeof id === "number");
      items = await getTestimonials({ locale, ids, limit: ids.length });
    }
  } else {
    items = await getTestimonials({
      locale,
      limit: block.limit ?? 3,
    });
  }

  if (!items.length) return null;

  return (
    <Section spacing="md">
      <Container className="space-y-8">
        <div className="max-w-2xl space-y-3">
          {block.eyebrow ? <Eyebrow>{block.eyebrow}</Eyebrow> : null}
          {block.title ? <SectionTitle>{block.title}</SectionTitle> : null}
        </div>
        <ul className="grid gap-4 md:grid-cols-3">
          {items.map((item) => (
            <li
              key={String(item.id)}
              className="rounded-2xl border border-border bg-card px-5 py-6"
            >
              <Body className="text-forest/90">“{item.quote}”</Body>
              <p className="mt-4 text-sm font-medium text-forest">{item.name}</p>
              {item.role ? (
                <p className="text-xs uppercase tracking-[0.12em] text-muted">
                  {item.role}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
