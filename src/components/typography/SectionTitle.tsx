import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type SectionTitleProps = HTMLAttributes<HTMLHeadingElement> & {
  children: ReactNode;
  as?: "h2" | "h3";
  tone?: "default" | "inverse";
};

export function SectionTitle({
  children,
  className,
  as: Tag = "h2",
  tone = "default",
  ...props
}: SectionTitleProps) {
  return (
    <Tag
      className={cn(
        "font-serif text-2xl font-normal tracking-tight sm:text-3xl",
        tone === "default" && "text-text-secondary",
        tone === "inverse" && "text-brand-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
