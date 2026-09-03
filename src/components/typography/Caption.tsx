import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type CaptionProps = HTMLAttributes<HTMLParagraphElement> & {
  children: ReactNode;
};

export function Caption({ children, className, ...props }: CaptionProps) {
  return (
    <p
      className={cn("text-text-primary text-xs leading-normal", className)}
      {...props}
    >
      {children}
    </p>
  );
}
