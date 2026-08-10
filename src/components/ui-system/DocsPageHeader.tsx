import { Body, Eyebrow, PageTitle } from "@/components/typography";

export function DocsPageHeader({
  eyebrow = "Components",
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-3">
      <Eyebrow>{eyebrow}</Eyebrow>
      <PageTitle as="h1" className="text-4xl sm:text-5xl">
        {title}
      </PageTitle>
      <Body className="max-w-2xl">{description}</Body>
    </div>
  );
}
