"use client";

import { Star } from "lucide-react";
import { Radio, RadioGroup } from "react-aria-components";
import { cn } from "@/lib/utils/cn";

type RatingProps = {
  value: number;
  label: string;
  reviewCount?: string;
  className?: string;
};

export function Rating({ value, label, reviewCount, className }: RatingProps) {
  const filledStars = Math.round(Math.min(5, Math.max(0, value)));

  return (
    <div
      aria-label={label}
      className={cn("flex items-center gap-1", className)}
    >
      <span className="flex items-center gap-0.5" aria-hidden>
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            className={cn(
              "size-3",
              index < filledStars
                ? "text-text-highlight fill-current"
                : "text-text-secondary",
            )}
            strokeWidth={1.5}
          />
        ))}
      </span>
      {reviewCount ? (
        <span className="text-text-secondary text-xs">({reviewCount})</span>
      ) : null}
    </div>
  );
}

type RatingInputProps = {
  value: number;
  onChange: (value: number) => void;
  label: string;
  clearLabel: string;
  valueLabel: (value: number) => string;
  disabled?: boolean;
  className?: string;
};

export function RatingInput({
  value,
  onChange,
  label,
  clearLabel,
  valueLabel,
  disabled = false,
  className,
}: RatingInputProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <span className="text-text-black text-sm font-medium">{label}</span>
      <RadioGroup
        aria-label={label}
        value={String(value)}
        onChange={(selected) => onChange(Number(selected))}
        isDisabled={disabled}
        className="flex flex-wrap items-center gap-1"
      >
        {Array.from({ length: 5 }, (_, index) => {
          const starValue = index + 1;
          return (
            <Radio
              key={starValue}
              value={String(starValue)}
              aria-label={valueLabel(starValue)}
              className="text-text-highlight focus-visible:ring-brand/40 inline-flex size-10 cursor-pointer items-center justify-center rounded-full focus-visible:ring-2 focus-visible:outline-none data-disabled:cursor-not-allowed data-disabled:opacity-50"
            >
              <Star
                aria-hidden
                className={cn("size-7", starValue <= value && "fill-current")}
                strokeWidth={1.5}
              />
            </Radio>
          );
        })}
      </RadioGroup>
    </div>
  );
}
