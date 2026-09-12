import { richTextToHtml } from "@/lib/cms/richtext";
import { cn } from "@/lib/utils/cn";
import type { SafeRichTextHtml } from "@/types/content";

type Props = { className?: string } & (
  { value: unknown; html?: never } | { html: SafeRichTextHtml; value?: never }
);

export function RichText({ value, html, className }: Props) {
  const content = html ?? richTextToHtml(value);
  if (!content) return null;
  return (
    <div
      className={cn(
        "text-text-primary space-y-4 text-base leading-relaxed font-light break-words",
        "[&_h2,&_h3,&_h4,&_h5,&_h6]:text-text-secondary [&_h2]:text-3xl [&_h2,&_h3,&_h4,&_h5,&_h6]:font-serif [&_h2,&_h3,&_h4,&_h5,&_h6]:font-normal [&_h3]:text-2xl [&_h4]:text-xl",
        "[&_li]:my-1 [&_ol]:list-decimal [&_strong]:font-bold [&_ul]:list-disc [&_ul,&_ol]:pl-6",
        "[&_a]:text-text-accent [&_a:hover]:text-text-secondary [&_a:focus-visible]:outline-ring [&_a]:underline [&_a]:underline-offset-4 [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-2",
        "[&_blockquote]:border-border [&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_blockquote]:italic",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
