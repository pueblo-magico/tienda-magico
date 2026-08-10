import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type CaptionProps = HTMLAttributes<HTMLParagraphElement> & {
  children: ReactNode;
};

export function Caption({ children, className, ...props }: CaptionProps) {
  return (
    <p
      className={cn("text-xs leading-normal text-forest/55", className)}
      {...props}
    >
      {children}
    </p>
  );
}