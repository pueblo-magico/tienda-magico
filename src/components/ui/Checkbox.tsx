"use client";

import {
  Checkbox as AriaCheckbox,
  type CheckboxProps,
} from "react-aria-components";
import { Check } from "lucide-react";
import type { ReactNode } from "react";

export function Checkbox({
  children,
  ...props
}: Omit<CheckboxProps, "children" | "className"> & { children: ReactNode }) {
  return (
    <AriaCheckbox
      {...props}
      className="group text-text-black flex cursor-pointer items-start gap-3 text-sm data-disabled:cursor-not-allowed data-disabled:opacity-50"
    >
      <span
        aria-hidden
        className="border-border group-data-selected:bg-forest group-data-focus-visible:ring-brand mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border group-data-focus-visible:ring-2 group-data-focus-visible:ring-offset-2 group-data-selected:text-white"
      >
        <Check
          className="size-4 opacity-0 group-data-selected:opacity-100"
          strokeWidth={2}
        />
      </span>
      <span>{children}</span>
    </AriaCheckbox>
  );
}
