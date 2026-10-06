import { Badge } from "@pueblo-magico/react-ui";
import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";

export default function BadgePage() {
  return (
    <>
      <DocsPageHeader
        title="Badge"
        description="Small labels for categories, stock state, and highlights."
      />
      <DocsSection title="Variants">
        <Badge>Default</Badge>
        <Badge variant="accent">Accent</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="danger">Danger</Badge>
        <Badge variant="outline">Outline</Badge>
      </DocsSection>
    </>
  );
}
