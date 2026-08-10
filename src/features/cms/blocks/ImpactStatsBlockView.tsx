import { ImpactCard } from "@/components/cards/ImpactCard";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Eyebrow, SectionTitle } from "@/components/typography";
import type { ImpactStatsBlockData } from "@/lib/cms";

export function ImpactStatsBlockView({ block }: { block: ImpactStatsBlockData }) {
  const stats = block.stats ?? [];
  if (!stats.length) return null;

  return (
    <Section spacing="md" tone="muted">
      <Container className="space-y-8">
        <div className="max-w-2xl space-y-3">
          {block.eyebrow ? <Eyebrow>{block.eyebrow}</Eyebrow> : null}
          {block.title ? <SectionTitle>{block.title}</SectionTitle> : null}
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <li key={`${stat.label}-${stat.value}`}>
              <ImpactCard
                value={stat.value}
                label={stat.label}
                description={stat.description ?? undefined}
              />
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
