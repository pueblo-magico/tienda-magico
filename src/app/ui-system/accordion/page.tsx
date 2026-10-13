"use client";

import { Accordion } from "@pueblo-magico/react-ui";
import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";
import { UserRound } from "lucide-react";
import { Input } from "@pueblo-magico/react-ui";

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
              header: "Shipping",
              content:
                "Free shipping on orders over $75 within the continental US.",
            },
            {
              id: "returns",
              header: "Returns",
              content: "Unopened products can be returned within 30 days.",
            },
            {
              id: "sourcing",
              header: "Sourcing",
              content:
                "Ingredients are sourced from regenerative mountain communities.",
            },
          ]}
        />
      </DocsSection>
      <DocsSection title="Tarjetas con iconos" className="w-full">
        <Accordion
          type="multiple"
          defaultExpandedItems={["datos"]}
          items={[
            {
              id: "datos",
              header: (
                <>
                  <UserRound aria-hidden strokeWidth={1.5} className="size-6" />
                  <span>Tus datos</span>
                </>
              ),
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
