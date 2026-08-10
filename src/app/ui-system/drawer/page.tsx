import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";
import { DrawerDemo } from "./DrawerDemo";

export default function DrawerPage() {
  return (
    <>
      <DocsPageHeader title="Drawer" description="Slide-over panel for cart, filters, and mobile flows." />
      <DocsSection title="Demo">
        <DrawerDemo />
      </DocsSection>
    </>
  );
}
