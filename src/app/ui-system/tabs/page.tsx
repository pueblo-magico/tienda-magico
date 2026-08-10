import { Tabs } from "@/components/ui/Tabs";
import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";

export default function TabsPage() {
  return (
    <>
      <DocsPageHeader title="Tabs" description="Keyboard-friendly tabs for product details and content grouping." />
      <DocsSection title="Example" className="w-full">
        <Tabs
          className="w-full"
          items={[
            {
              id: "details",
              label: "Details",
              content: "Organic mountain cacao grown at high altitude.",
            },
            {
              id: "impact",
              label: "Impact",
              content: "Each bag funds community reforestation projects.",
            },
            {
              id: "ritual",
              label: "Ritual",
              content: "Whisk with hot water and sip slowly in the morning.",
            },
          ]}
        />
      </DocsSection>
    </>
  );
}
