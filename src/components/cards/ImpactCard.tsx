import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

export type ImpactCardProps = {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
};

export function ImpactCard({
  value,
  label,
  description,
  icon,
  className,
}: ImpactCardProps) {
  return (
    <article
      className={cn(
        "rounded-2xl border border-border bg-card px-5 py-6 text-center",
        className,
      )}
    >
      {icon ? <div className="mb-3 flex justify-center text-forest">{icon}</div> : null}
      <p className="font-serif text-3xl font-medium text-forest sm:text-4xl">{value}</p>
      <p className="mt-2 text-sm font-medium uppercase tracking-[0.12em] text-forest/70">
        {label}
      </p>
      {description ? (
        <p className="mt-2 text-sm leading-relaxed text-forest/60">{description}</p>
      ) : null}
    </article>
  );
}
