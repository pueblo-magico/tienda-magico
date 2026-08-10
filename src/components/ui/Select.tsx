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
};

export function Select({
  className,
  label,
  error,
  options,
  placeholder,
  id,
  ...props
}: SelectProps) {
  const selectId = id ?? props.name;

  return (
    <label className="flex w-full flex-col gap-1.5 text-sm text-forest">
      {label ? <span className="font-medium">{label}</span> : null}
      <select
        id={selectId}
        className={cn(
          "h-11 w-full appearance-none rounded-full border border-border bg-card px-4 text-sm text-forest",
          "transition-colors focus-visible:border-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30",
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
      {error ? <span className="text-xs text-clay">{error}</span> : null}
    </label>
  );
}
