import { Badge } from "@/components/ui/Badge";
import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";

export default function BadgePage() {
  return (
    <>
      <DocsPageHeader title="Badge" description="Small labels for categories, stock state, and highlights." />
      <DocsSection title="Variants">
        <Badge>Default</Badge>
        <Badge variant="forest">Forest</Badge>
        <Badge variant="earth">Earth</Badge>
        <Badge variant="clay">Clay</Badge>
        <Badge variant="outline">Outline</Badge>
      </DocsSection>
    </>
  );
}
