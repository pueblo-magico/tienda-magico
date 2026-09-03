import { richTextToHtml } from "@/lib/cms";
import { cn } from "@/lib/utils/cn";

export function RichText({
  value,
  className,
}: {
  value: unknown;
  className?: string;
}) {
  const html = richTextToHtml(value);
  if (!html) return null;

  return (
    <div
      className={cn(
        "prose prose-forest text-forest/85 max-w-none text-base leading-relaxed",
        "prose-headings:font-serif prose-headings:font-normal prose-a:text-brand",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
