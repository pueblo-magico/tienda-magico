import { Input } from "@/components/ui/Input";
import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";

export default function InputPage() {
  return (
    <>
      <DocsPageHeader title="Input" description="Rounded text fields with optional label, hint, and error states." />
      <DocsSection title="Examples" className="w-full max-w-md flex-col items-stretch">
        <Input label="Email" name="email" placeholder="you@example.com" hint="We'll never share your email." />
        <Input label="Email" name="email-error" defaultValue="bad@" error="Enter a valid email address." />
      </DocsSection>
    </>
  );
}
