"use client";

import { DynamicIcon } from "lucide-react/dynamic.js";
import type { CategoryIcon as CategoryIconName } from "@/types/commerce";

export function CategoryIcon({ name }: { name: CategoryIconName }) {
  return (
    <DynamicIcon
      aria-hidden="true"
      className="size-8"
      name={name}
      strokeWidth={1}
    />
  );
}
