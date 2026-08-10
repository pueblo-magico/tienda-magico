import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export function Textarea({
  className,
  label,
  error,
  hint,
  id,
  rows = 4,
  ...props
}: TextareaProps) {
  const textareaId = id ?? props.name;

  return (
    <label className="flex w-full flex-col gap-1.5 text-sm text-forest">
      {label ? <span className="font-medium">{label}</span> : null}
      <textarea
        id={textareaId}
        rows={rows}
        className={cn(
          "w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-forest placeholder:text-forest/40",
          "transition-colors focus-visible:border-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30",
          error && "border-clay focus-visible:ring-clay/40",
          className,
        )}
        aria-invalid={Boolean(error) || undefined}
        {...props}
      />
      {error ? (
        <span className="text-xs text-clay">{error}</span>
      ) : hint ? (
        <span className="text-xs text-forest/55">{hint}</span>
      ) : null}
    </label>
  );
}
