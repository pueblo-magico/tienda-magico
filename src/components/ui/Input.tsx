"use client";

import { useRef, type InputHTMLAttributes } from "react";
import { formatArsInputElement, formatArsPesos } from "@/lib/money/ars-input";
import { cn } from "@/lib/utils/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
  format?: "ars-pesos";
};

export function Input({
  className,
  label,
  error,
  hint,
  id,
  format,
  onChange,
  value,
  defaultValue,
  onBeforeInput,
  ...props
}: InputProps) {
  const inputId = id ?? props.name;
  const previousValue = useRef(String(value ?? defaultValue ?? ""));

  return (
    <label className="text-forest flex w-full flex-col gap-1.5 text-sm">
      {label ? <span className="font-medium">{label}</span> : null}
      <input
        id={inputId}
        className={cn(
          "border-border bg-card text-forest placeholder:text-forest/40 h-11 w-full rounded-full border px-4 text-sm",
          "focus-visible:border-forest focus-visible:ring-brand/30 transition-colors focus-visible:ring-2 focus-visible:outline-none",
          error && "border-clay focus-visible:ring-clay/40",
          className,
        )}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={
          error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
        }
        {...props}
        type={format === "ars-pesos" ? "text" : props.type}
        inputMode={format === "ars-pesos" ? "numeric" : props.inputMode}
        value={
          format && value !== undefined ? formatArsPesos(String(value)) : value
        }
        defaultValue={
          format && defaultValue !== undefined
            ? formatArsPesos(String(defaultValue))
            : defaultValue
        }
        onChange={(event) => {
          if (format === "ars-pesos") {
            const native = event.nativeEvent as InputEvent;
            if (!native.isComposing)
              formatArsInputElement(
                event.currentTarget,
                native.inputType ?? "",
                previousValue.current,
              );
            previousValue.current = event.currentTarget.value;
          }
          onChange?.(event);
        }}
        onBeforeInput={(event) => {
          previousValue.current = event.currentTarget.value;
          onBeforeInput?.(event);
        }}
      />
      {error ? (
        <span id={`${inputId}-error`} className="text-clay text-xs">
          {error}
        </span>
      ) : hint ? (
        <span id={`${inputId}-hint`} className="text-forest/55 text-xs">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
