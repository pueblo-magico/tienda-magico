import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type PageTitleProps = HTMLAttributes<HTMLHeadingElement> & {
  children: ReactNode;
  as?: "h1" | "h2";
};

export function PageTitle({
  children,
  className,
  as: Tag = "h1",
  ...props
}: PageTitleProps) {
  return (
    <Tag
      className={cn(
        "text-forest font-serif text-4xl font-normal tracking-tight sm:text-5xl lg:text-6xl",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
