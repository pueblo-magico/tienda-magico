import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type SectionProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  spacing?: "sm" | "md" | "lg";
  tone?: "default" | "muted" | "inverse";
};

const spacingClasses = {
  sm: "py-10 sm:py-12",
  md: "py-14 sm:py-16",
  lg: "py-16 sm:py-24",
} as const;

const toneClasses = {
  default: "bg-transparent text-forest",
  muted: "bg-muted/60 text-forest",
  inverse: "bg-forest text-brand-foreground",
} as const;

export function Section({
  children,
  className,
  spacing = "md",
  tone = "default",
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(spacingClasses[spacing], toneClasses[tone], className)}
      {...props}
    >
      {children}
    </section>
  );
}
