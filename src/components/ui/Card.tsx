import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-text-black border-border flex flex-col gap-5 rounded-xl border py-5",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  layout = "stack",
  ...props
}: ComponentProps<"div"> & { layout?: "stack" | "split" }) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        layout === "split"
          ? "flex flex-wrap items-start justify-between gap-3 px-5"
          : "grid gap-2 px-5",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  variant = "default",
  ...props
}: ComponentProps<"h2"> & { variant?: "default" | "editorial" }) {
  return (
    <h2
      data-slot="card-title"
      className={cn(
        "leading-snug",
        variant === "editorial"
          ? "text-text-secondary font-serif text-2xl font-normal sm:text-3xl"
          : "text-base font-bold",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-text-primary text-sm leading-relaxed", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-5", className)}
      {...props}
    />
  );
}

export function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center gap-3 px-5", className)}
      {...props}
    />
  );
}
