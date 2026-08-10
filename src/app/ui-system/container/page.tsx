import { Container } from "@/components/layout/Container";
import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";

export default function ContainerPage() {
  return (
    <>
      <DocsPageHeader title="Container" description="Centered max-width wrapper with consistent horizontal padding." />
      <DocsSection title="Widths" className="w-full flex-col items-stretch gap-3">
        <Container width="narrow" className="rounded-xl bg-forest/10 py-4 text-center text-sm">
          narrow
        </Container>
        <Container width="default" className="rounded-xl bg-forest/10 py-4 text-center text-sm">
          default
        </Container>
        <Container width="wide" className="rounded-xl bg-forest/10 py-4 text-center text-sm">
          wide
        </Container>
      </DocsSection>
    </>
  );
}
