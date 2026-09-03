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
        "border-border bg-card rounded-2xl border px-5 py-6 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="text-forest mb-3 flex justify-center">{icon}</div>
      ) : null}
      <p className="text-forest font-serif text-3xl font-normal sm:text-4xl">
        {value}
      </p>
      <p className="text-forest/70 mt-2 text-sm font-medium tracking-[0.12em] uppercase">
        {label}
      </p>
      {description ? (
        <p className="text-forest/60 mt-2 text-sm leading-relaxed">
          {description}
        </p>
      ) : null}
    </article>
  );
}
