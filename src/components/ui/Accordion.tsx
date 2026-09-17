"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { ChevronDown, Minus, Plus } from "lucide-react";

export type AccordionItem = {
  id: string;
  title: string;
  content: ReactNode;
  icon?: ReactNode;
};

export type AccordionProps = {
  items: AccordionItem[];
  type?: "single" | "multiple";
  className?: string;
  variant?: "default" | "card";
  defaultOpenItems?: string[];
};

export function Accordion({
  items,
  type = "single",
  className,
  variant = "default",
  defaultOpenItems = [],
}: AccordionProps) {
  const baseId = useId();
  const [openItems, setOpenItems] = useState<string[]>(() =>
    type === "single" ? defaultOpenItems.slice(0, 1) : defaultOpenItems,
  );

  const toggle = (id: string) => {
    setOpenItems((current) => {
      const isOpen = current.includes(id);
      if (type === "single") {
        return isOpen ? [] : [id];
      }
      return isOpen ? current.filter((item) => item !== id) : [...current, id];
    });
  };

  return (
    <div
      className={cn(
        variant === "card"
          ? "space-y-3"
          : "divide-border border-border divide-y rounded-2xl border",
        className,
      )}
    >
      {items.map((item) => {
        const isOpen = openItems.includes(item.id);
        const panelId = `${baseId}-${item.id}-panel`;
        const buttonId = `${baseId}-${item.id}-button`;

        return (
          <div
            key={item.id}
            className={
              variant === "card"
                ? "border-border bg-card overflow-hidden rounded-xl border"
                : undefined
            }
          >
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                className={cn(
                  "focus-visible:ring-ring flex w-full items-center justify-between gap-4 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset",
                  variant === "card"
                    ? "text-text-secondary hover:bg-card-hover px-5 py-4 text-base font-bold"
                    : "text-forest hover:bg-forest/5 px-4 py-3 text-sm font-medium",
                )}
              >
                <span className="flex items-center gap-4">
                  {item.icon ? (
                    <span aria-hidden className="shrink-0">
                      {item.icon}
                    </span>
                  ) : null}
                  {item.title}
                </span>
                <span aria-hidden className="shrink-0">
                  {variant === "card" ? (
                    <ChevronDown
                      className={cn(
                        "size-4 transition-transform motion-reduce:transition-none",
                        isOpen && "rotate-180",
                      )}
                    />
                  ) : isOpen ? (
                    <Minus aria-hidden className="size-4" />
                  ) : (
                    <Plus aria-hidden className="size-4" />
                  )}
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className={cn(
                "text-sm leading-relaxed",
                variant === "card"
                  ? "text-text-secondary px-5 pb-5"
                  : "text-forest/75 px-4 pb-4",
              )}
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
