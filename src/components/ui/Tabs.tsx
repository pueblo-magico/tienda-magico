"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type TabItem = {
  id: string;
  label: string;
  content: ReactNode;
};

export type TabsProps = {
  items: TabItem[];
  defaultValue?: string;
  className?: string;
};

export function Tabs({ items, defaultValue, className }: TabsProps) {
  const baseId = useId();
  const [active, setActive] = useState(defaultValue ?? items[0]?.id);

  return (
    <div className={cn("space-y-4", className)}>
      <div
        role="tablist"
        aria-label="Content tabs"
        className="flex flex-wrap gap-2 border-b border-border pb-2"
      >
        {items.map((item) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              id={`${baseId}-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(item.id)}
              className={cn(
                "rounded-full px-4 py-2 text-sm transition-colors",
                selected
                  ? "bg-forest text-brand-foreground"
                  : "text-forest/70 hover:bg-forest/5 hover:text-forest",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {items.map((item) => {
        const selected = item.id === active;
        return (
          <div
            key={item.id}
            id={`${baseId}-panel-${item.id}`}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-${item.id}`}
            hidden={!selected}
            className="text-sm leading-relaxed text-forest/75"
          >
            {item.content}
          </div>
        );
      })}
    </div>
  );
}
