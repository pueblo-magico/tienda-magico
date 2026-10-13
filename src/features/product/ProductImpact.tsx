import { StatCard } from "@pueblo-magico/react-ui";
import { Container } from "@pueblo-magico/react-ui";
import { Section } from "@pueblo-magico/react-ui";
import { Eyebrow, SectionTitle } from "@pueblo-magico/react-ui";

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
              <StatCard value={item.value} label={item.label} />
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
