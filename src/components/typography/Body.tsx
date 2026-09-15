import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type BodyProps = HTMLAttributes<HTMLParagraphElement> & {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  tone?: "default" | "inverse";
};

const sizeClasses = {
  sm: "text-sm leading-relaxed",
  md: "text-base leading-relaxed",
  lg: "text-lg leading-relaxed",
} as const;

export function Body({
  children,
  className,
  size = "md",
  tone = "default",
  ...props
}: BodyProps) {
  return (
    <p
      className={cn(
        sizeClasses[size],
        tone === "default" && "text-text-primary",
        tone === "inverse" && "text-brand-foreground/80",
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
}
