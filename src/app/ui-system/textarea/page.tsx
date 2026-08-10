import { Textarea } from "@/components/ui/Textarea";
import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";

export default function TextareaPage() {
  return (
    <>
      <DocsPageHeader title="Textarea" description="Multi-line input for notes, contact forms, and CMS fields." />
      <DocsSection title="Example" className="w-full max-w-md">
        <Textarea
          label="Message"
          name="message"
          placeholder="Tell us about your ritual..."
          hint="Max 500 characters"
        />
      </DocsSection>
    </>
  );
}
