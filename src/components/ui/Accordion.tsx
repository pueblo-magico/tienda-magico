"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { MinusIcon, PlusIcon } from "@phosphor-icons/react";

export type AccordionItem = {
  id: string;
  title: string;
  content: ReactNode;
};

export type AccordionProps = {
  items: AccordionItem[];
  type?: "single" | "multiple";
  className?: string;
};

export function Accordion({
  items,
  type = "single",
  className,
}: AccordionProps) {
  const baseId = useId();
  const [openItems, setOpenItems] = useState<string[]>([]);

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
        "divide-border border-border divide-y rounded-2xl border",
        className,
      )}
    >
      {items.map((item) => {
        const isOpen = openItems.includes(item.id);
        const panelId = `${baseId}-${item.id}-panel`;
        const buttonId = `${baseId}-${item.id}-button`;

        return (
          <div key={item.id}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                className="text-forest hover:bg-forest/5 flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm font-medium transition-colors"
              >
                <span>{item.title}</span>
                <span aria-hidden className="text-forest/50">
                  {isOpen ? (
                    <MinusIcon aria-hidden className="size-4" />
                  ) : (
                    <PlusIcon aria-hidden className="size-4" />
                  )}
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="text-forest/75 px-4 pb-4 text-sm leading-relaxed"
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
