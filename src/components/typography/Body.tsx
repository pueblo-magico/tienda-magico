import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type BodyProps = HTMLAttributes<HTMLParagraphElement> & {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
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
  ...props
}: BodyProps) {
  return (
    <p
      className={cn("text-forest/75", sizeClasses[size], className)}
      {...props}
    >
      {children}
    </p>
  );
}