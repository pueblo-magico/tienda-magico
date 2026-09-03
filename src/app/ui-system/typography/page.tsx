import {
  Body,
  Caption,
  Eyebrow,
  PageTitle,
  SectionTitle,
} from "@/components/typography";
import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";

export default function TypographyPage() {
  return (
    <>
      <DocsPageHeader
        title="Typography"
        description="Editorial hierarchy using Georgia for display titles and Inter for readable body content."
      />
      <DocsSection title="Scale" className="w-full flex-col items-start gap-5">
        <div className="space-y-2">
          <Eyebrow>Eyebrow</Eyebrow>
          <PageTitle as="h2" className="text-4xl sm:text-5xl">
            PageTitle
          </PageTitle>
          <SectionTitle>SectionTitle</SectionTitle>
          <Body>
            Body copy for product storytelling and long-form content across the
            shop experience.
          </Body>
          <Body size="sm">Body sm for denser supporting text.</Body>
          <Caption>Caption for meta information and helper text.</Caption>
        </div>
      </DocsSection>
    </>
  );
}
