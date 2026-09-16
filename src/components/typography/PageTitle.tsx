import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type PageTitleProps = HTMLAttributes<HTMLHeadingElement> & {
  children: ReactNode;
  as?: "h1" | "h2";
  tone?: "default" | "inverse";
};

export function PageTitle({
  children,
  className,
  as: Tag = "h1",
  tone = "default",
  ...props
}: PageTitleProps) {
  return (
    <Tag
      className={cn(
        "font-serif text-4xl font-normal tracking-tight sm:text-5xl lg:text-6xl",
        tone === "inverse" ? "text-brand-foreground" : "text-text-secondary",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
