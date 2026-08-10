import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  width?: "default" | "narrow" | "wide";
};

const widthClasses = {
  narrow: "max-w-3xl",
  default: "max-w-6xl",
  wide: "max-w-7xl",
} as const;

export function Container({
  children,
  className,
  width = "default",
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full px-4 sm:px-6", widthClasses[width], className)}
      {...props}
    >
      {children}
    </div>
  );
}
