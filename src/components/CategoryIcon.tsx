"use client";

import { DynamicIcon } from "lucide-react/dynamic.js";
import type { CategoryIcon as CategoryIconName } from "@/types/commerce";

export function CategoryIcon({
  name,
  className,
}: {
  name: CategoryIconName;
  className?: string;
}) {
  return (
    <DynamicIcon
      aria-hidden="true"
      className={className ?? "size-8"}
      name={name}
      strokeWidth={1}
    />
  );
}
