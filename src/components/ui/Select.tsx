import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type SelectOption = {
  label: string;
  value: string;
};

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  layout?: "stacked" | "inline";
  controlSize?: "default" | "compact";
};

export function Select({
  className,
  label,
  error,
  options,
  placeholder,
  layout = "stacked",
  controlSize = "default",
  id,
  ...props
}: SelectProps) {
  const selectId = id ?? props.name;

  return (
    <label
      className={cn(
        "text-forest flex w-full gap-1.5 text-sm",
        layout === "inline" ? "items-center justify-end" : "flex-col",
      )}
    >
      {label ? (
        <span className={
          cn("w-full",
          controlSize === "default" && "font-medium")
        }>
          {label}
        </span>
      ) : null}
      <select
        id={selectId}
        className={cn(
          "border-border bg-card text-forest h-11 w-full appearance-none rounded-full border px-4 text-sm",
          "focus-visible:border-forest focus-visible:ring-brand/30 transition-colors focus-visible:ring-2 focus-visible:outline-none",
          controlSize === "compact" && "h-9 rounded-md px-3 text-xs",
          error && "border-clay focus-visible:ring-clay/40",
          className,
        )}
        aria-invalid={Boolean(error) || undefined}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className="text-clay text-xs">{error}</span> : null}
    </label>
  );
}
