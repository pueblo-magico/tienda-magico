import { ImpactCard } from "@/components/cards";
import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";

export default function ImpactCardPage() {
  return (
    <>
      <DocsPageHeader title="ImpactCard" description="Highlight regenerative metrics and community outcomes." />
      <DocsSection title="Example" className="w-full max-w-sm">
        <ImpactCard
          value="15,000+"
          label="Trees planted"
          description="Supported through community reforestation partnerships."
        />
      </DocsSection>
    </>
  );
}
