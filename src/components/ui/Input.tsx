import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export function Input({
  className,
  label,
  error,
  hint,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? props.name;

  return (
    <label className="flex w-full flex-col gap-1.5 text-sm text-forest">
      {label ? <span className="font-medium">{label}</span> : null}
      <input
        id={inputId}
        className={cn(
          "h-11 w-full rounded-full border border-border bg-card px-4 text-sm text-forest placeholder:text-forest/40",
          "transition-colors focus-visible:border-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30",
          error && "border-clay focus-visible:ring-clay/40",
          className,
        )}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={
          error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
        }
        {...props}
      />
      {error ? (
        <span id={`${inputId}-error`} className="text-xs text-clay">
          {error}
        </span>
      ) : hint ? (
        <span id={`${inputId}-hint`} className="text-xs text-forest/55">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
