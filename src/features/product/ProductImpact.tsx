import { ImpactCard } from "@/components/cards/ImpactCard";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Eyebrow, SectionTitle } from "@/components/typography";

type Props = {
  eyebrow: string;
  title: string;
  items: Array<{ value: string; label: string }>;
};

export function ProductImpact({ eyebrow, title, items }: Props) {
  if (!items.length) return null;

  return (
    <Section spacing="md">
      <Container className="space-y-8">
        <div className="max-w-2xl space-y-3">
          <Eyebrow>{eyebrow}</Eyebrow>
          <SectionTitle>{title}</SectionTitle>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <li key={item.label}>
              <ImpactCard value={item.value} label={item.label} />
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
