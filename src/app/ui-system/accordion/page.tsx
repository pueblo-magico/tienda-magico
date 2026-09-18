import { Accordion } from "@/components/ui/Accordion";
import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";
import { UserRound } from "lucide-react";
import { Input } from "@/components/ui/Input";

export default function AccordionPage() {
  return (
    <>
      <DocsPageHeader
        title="Accordion"
        description="Accessible expandable sections for FAQs and product details."
      />
      <DocsSection title="Example" className="w-full">
        <Accordion
          className="w-full"
          items={[
            {
              id: "shipping",
              title: "Shipping",
              content:
                "Free shipping on orders over $75 within the continental US.",
            },
            {
              id: "returns",
              title: "Returns",
              content: "Unopened products can be returned within 30 days.",
            },
            {
              id: "sourcing",
              title: "Sourcing",
              content:
                "Ingredients are sourced from regenerative mountain communities.",
            },
          ]}
        />
      </DocsSection>
      <DocsSection title="Tarjetas con iconos" className="w-full">
        <Accordion
          variant="card"
          type="multiple"
          defaultOpenItems={["datos"]}
          items={[
            {
              id: "datos",
              title: "Tus datos",
              icon: <UserRound strokeWidth={1.5} className="size-6" />,
              content: (
                <Input
                  name="accordion-example-name"
                  label="Nombre"
                  placeholder="Tu nombre completo"
                />
              ),
            },
          ]}
        />
      </DocsSection>
    </>
  );
}
