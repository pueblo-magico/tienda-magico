import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type BadgeVariant = "default" | "forest" | "earth" | "clay" | "outline";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  variant?: BadgeVariant;
};

const variants: Record<BadgeVariant, string> = {
  default: "bg-card-hover text-text-secondary",
  forest: "bg-forest text-brand-foreground",
  earth: "bg-earth text-brand-foreground",
  clay: "bg-clay text-brand-foreground",
  outline: "bg-transparent border border-border text-forest",
};

export function Badge({
  children,
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium tracking-[0.12em] uppercase",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
