import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type InfoCardProps = {
  eyebrow?: string;
  title: ReactNode;
  description: string;
  icon?: ReactNode;
  variant?: "default" | "centered" | "prominent" | "testimonial";
  tone?: "default" | "muted" | "inverse" | "accent";
  as?: "article" | "li";
  className?: string;
};

export function InfoCard({
  eyebrow,
  title,
  description,
  icon,
  variant = "default",
  tone = "default",
  as: Component = "article",
  className,
}: InfoCardProps) {
  const isInverse = tone === "inverse" || tone === "accent";
  const hasDarkTestimonialTone =
    tone === "muted" || tone === "inverse" || tone === "accent";

  if (variant === "testimonial") {
    return (
      <Component
        className={cn(
          "rounded-2xl border p-6",
          tone === "default" && "border-border bg-card",
          tone === "muted" && "border-border bg-background-secondary",
          tone === "inverse" &&
            "border-brand-foreground/15 bg-brand-foreground/10",
          tone === "accent" && "border-text-highlight/50 bg-brand-hover",
          className,
        )}
      >
        <div className="flex h-full flex-col items-start justify-center gap-5 sm:flex-row sm:items-center sm:gap-7">
          {icon ? <div className="shrink-0">{icon}</div> : null}
          <div className="max-w-xl">
            <blockquote
              className={cn(
                "font-serif text-xl leading-relaxed italic",
                hasDarkTestimonialTone
                  ? "text-brand-foreground"
                  : "text-text-secondary",
              )}
            >
              {title}
            </blockquote>
            {eyebrow ? (
              <p
                className={cn(
                  "mt-5 text-sm font-bold",
                  hasDarkTestimonialTone
                    ? "text-text-highlight"
                    : "text-text-secondary",
                )}
              >
                {eyebrow}
              </p>
            ) : null}
            <p
              className={cn(
                "mt-1 text-sm",
                hasDarkTestimonialTone
                  ? "text-brand-foreground/70"
                  : "text-text-primary",
              )}
            >
              {description}
            </p>
          </div>
        </div>
      </Component>
    );
  }

  return (
    <Component
      className={cn(
        "rounded-2xl border p-5",
        tone === "default" && "border-border bg-card",
        tone === "muted" && "border-border bg-background-secondary",
        tone === "inverse" &&
          "border-brand-foreground/15 bg-brand-foreground/10",
        tone === "accent" && "border-text-highlight/50 bg-brand-hover",
        variant === "centered" && "text-center",
        className,
      )}
    >
      {icon ? (
        <div
          className={cn(
            "text-text-highlight mb-4",
            variant === "centered" && "flex justify-center",
          )}
        >
          {icon}
        </div>
      ) : null}
      {eyebrow ? (
        <p
          className={cn(
            "text-text-highlight text-sm font-medium",
            variant === "prominent" && "font-bold tracking-widest uppercase",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h3
        className={cn(
          "mt-2",
          variant === "prominent"
            ? "text-brand-foreground font-serif text-3xl"
            : "text-lg font-medium",
          variant !== "prominent" && !isInverse && "text-text-secondary",
          variant === "centered" && "font-bold",
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          "mt-1 text-xs leading-relaxed",
          isInverse ? "text-brand-foreground/70" : "text-text-primary",
          variant === "centered" && "mt-2",
          variant === "prominent" && "mt-3 font-bold",
        )}
      >
        {description}
      </p>
    </Component>
  );
}
