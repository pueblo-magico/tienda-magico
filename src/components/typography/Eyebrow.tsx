import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type EyebrowProps = HTMLAttributes<HTMLParagraphElement> & {
  children: ReactNode;
};

export function Eyebrow({ children, className, ...props }: EyebrowProps) {
  return (
    <p
      className={cn(
        "text-xs font-medium uppercase tracking-[0.2em] text-forest/55",
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
}