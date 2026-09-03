import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function DocsSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className="border-border bg-card/70 space-y-4 rounded-2xl border p-6">
      <div className="space-y-1">
        <h2 className="text-forest font-serif text-xl font-normal">{title}</h2>
        {description ? (
          <p className="text-forest/65 text-sm">{description}</p>
        ) : null}
      </div>
      <div className={cn("flex flex-wrap items-center gap-4", className)}>
        {children}
      </div>
    </section>
  );
}
