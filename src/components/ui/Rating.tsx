import { Star } from "lucide-react";
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
