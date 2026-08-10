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
        "prose prose-forest max-w-none text-base leading-relaxed text-forest/85",
        "prose-headings:font-serif prose-headings:font-medium prose-a:text-brand",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
