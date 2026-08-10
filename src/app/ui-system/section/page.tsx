import { Section } from "@/components/layout/Section";
import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";

export default function SectionPage() {
  return (
    <>
      <DocsPageHeader title="Section" description="Vertical spacing and background tones for page composition." />
      <DocsSection title="Tones" className="w-full flex-col items-stretch gap-3">
        <Section spacing="sm" className="rounded-xl border border-border px-4">
          default tone
        </Section>
        <Section spacing="sm" tone="muted" className="rounded-xl px-4">
          muted tone
        </Section>
        <Section spacing="sm" tone="inverse" className="rounded-xl px-4">
          inverse tone
        </Section>
      </DocsSection>
    </>
  );
}
