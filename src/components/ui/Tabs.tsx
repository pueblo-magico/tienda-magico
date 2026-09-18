"use client";

import type { ReactNode } from "react";
import {
  Tabs as AriaTabs,
  TabList,
  Tab,
  TabPanel,
  SelectionIndicator,
} from "react-aria-components";
import { cn } from "@/lib/utils/cn";

export type TabItem<Value extends string = string> = {
  id: Value;
  label: string;
  content: ReactNode;
  disabled?: boolean;
};

export type TabsProps<Value extends string = string> = {
  items: TabItem<Value>[];
  label: string;
  defaultValue?: Value;
  value?: Value;
  onValueChange?: (value: Value) => void;
  className?: string;
};

export function Tabs<Value extends string = string>({
  items,
  label,
  defaultValue,
  value,
  onValueChange,
  className,
}: TabsProps<Value>) {
  return (
    <AriaTabs
      selectedKey={value}
      defaultSelectedKey={defaultValue}
      onSelectionChange={(key) => {
        const item = items.find((candidate) => candidate.id === key);
        if (item) onValueChange?.(item.id);
      }}
      className={cn("min-w-0 space-y-5", className)}
    >
      <TabList
        aria-label={label}
        className="border-border flex gap-5 overflow-x-auto border-b sm:gap-8"
      >
        {items.map((item) => (
          <Tab
            key={item.id}
            id={item.id}
            isDisabled={item.disabled}
            className="text-text-primary hover:text-text-secondary data-selected:text-text-secondary data-focus-visible:outline-ring relative shrink-0 cursor-pointer px-3 py-4 text-sm font-light whitespace-nowrap -outline-offset-4 transition-colors duration-500 data-disabled:cursor-not-allowed data-disabled:opacity-50 data-focus-visible:outline-2 data-selected:font-bold"
          >
            {item.label}
            <SelectionIndicator
              aria-hidden
              data-slot="tab-indicator"
              className="bg-brand pointer-events-none absolute inset-x-0 bottom-0 h-1 transition-[translate,width] duration-300 ease-out motion-reduce:transition-none"
            />
          </Tab>
        ))}
      </TabList>
      {items.map((item) => (
        <TabPanel
          key={item.id}
          id={item.id}
          className="text-text-primary outline-ring text-sm leading-relaxed focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          {item.content}
        </TabPanel>
      ))}
    </AriaTabs>
  );
}
