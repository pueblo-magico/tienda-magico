import { Button } from "@/components/ui/Button";
import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";

export default function ButtonPage() {
  return (
    <>
      <DocsPageHeader
        title="Button"
        description="Pill-shaped actions matching the shop CTAs. Supports primary, secondary, ghost, and link variants, plus optional href rendering."
      />

      <DocsSection title="Variants" description="Primary for commerce CTAs; secondary/ghost for quieter actions; link for inline navigation.">
        <Button>Shop collection</Button>
        <Button variant="secondary">Learn more</Button>
        <Button variant="ghost">View details</Button>
        <Button variant="link" href="/ui-system">Design system</Button>
      </DocsSection>

      <DocsSection title="Sizes">
        <Button size="sm">Add to cart</Button>
        <Button size="md">Add to cart</Button>
        <Button size="lg">Add to cart</Button>
      </DocsSection>

      <DocsSection title="States">
        <Button disabled>Sold out</Button>
        <Button variant="secondary" disabled>
          Unavailable
        </Button>
      </DocsSection>
    </>
  );
}
