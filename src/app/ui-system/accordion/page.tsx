import { Accordion } from "@/components/ui/Accordion";
import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";

export default function AccordionPage() {
  return (
    <>
      <DocsPageHeader title="Accordion" description="Accessible expandable sections for FAQs and product details." />
      <DocsSection title="Example" className="w-full">
        <Accordion
          className="w-full"
          items={[
            {
              id: "shipping",
              title: "Shipping",
              content: "Free shipping on orders over $75 within the continental US.",
            },
            {
              id: "returns",
              title: "Returns",
              content: "Unopened products can be returned within 30 days.",
            },
            {
              id: "sourcing",
              title: "Sourcing",
              content: "Ingredients are sourced from regenerative mountain communities.",
            },
          ]}
        />
      </DocsSection>
    </>
  );
}
