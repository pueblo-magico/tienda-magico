"use client";

import { Textarea } from "@pueblo-magico/react-ui";
import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";

export default function TextareaPage() {
  return (
    <>
      <DocsPageHeader
        title="Textarea"
        description="Multi-line input for notes, contact forms, and CMS fields."
      />
      <DocsSection title="Example" className="w-full max-w-md">
        <Textarea
          label="Message"
          name="message"
          placeholder="Tell us about your ritual..."
          description="Máximo 500 caracteres"
        />
      </DocsSection>
    </>
  );
}
