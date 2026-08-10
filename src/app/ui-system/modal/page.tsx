import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";
import { ModalDemo } from "./ModalDemo";

export default function ModalPage() {
  return (
    <>
      <DocsPageHeader title="Modal" description="Accessible dialog built on the native HTML dialog element." />
      <DocsSection title="Demo">
        <ModalDemo />
      </DocsSection>
    </>
  );
}
