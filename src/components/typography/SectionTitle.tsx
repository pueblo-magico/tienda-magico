import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type SectionTitleProps = HTMLAttributes<HTMLHeadingElement> & {
  children: ReactNode;
  as?: "h2" | "h3";
};

export function SectionTitle({
  children,
  className,
  as: Tag = "h2",
  ...props
}: SectionTitleProps) {
  return (
    <Tag
      className={cn(
        "text-forest font-serif text-2xl font-normal tracking-tight sm:text-3xl",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
