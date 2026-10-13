import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";
import { DrawerDemo } from "./DrawerDemo";

export default function DrawerPage() {
  return (
    <>
      <DocsPageHeader
        title="Drawer"
        description="Panel lateral compartido con foco contenido, cierre por Escape, restauración del foco y ubicación lógica al inicio o al final."
      />
      <DocsSection title="Demo">
        <DrawerDemo />
      </DocsSection>
    </>
  );
}
