import { ArticleCard } from "@/components/cards";
import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";

export default function ArticleCardPage() {
  return (
    <>
      <DocsPageHeader title="ArticleCard" description="Journal teaser card for stories and rituals." />
      <DocsSection title="Example" className="w-full max-w-md">
        <ArticleCard
          href="/en/journal/morning-ritual"
          title="A slower morning ritual"
          excerpt="How mountain communities start the day with cacao, breath, and quiet intention."
          category="Rituals"
          imageSrc="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"
        />
      </DocsSection>
    </>
  );
}
