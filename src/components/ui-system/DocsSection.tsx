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
    <section className="space-y-4 rounded-2xl border border-border bg-card/70 p-6">
      <div className="space-y-1">
        <h2 className="font-serif text-xl font-medium text-forest">{title}</h2>
        {description ? (
          <p className="text-sm text-forest/65">{description}</p>
        ) : null}
      </div>
      <div className={cn("flex flex-wrap items-center gap-4", className)}>
        {children}
      </div>
    </section>
  );
}
