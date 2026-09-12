"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { ProductVariant } from "@/types/commerce";

const SelectionContext = createContext<{
  variant: ProductVariant | null;
  select: (variant: ProductVariant | null) => void;
} | null>(null);

export function ProductSelection({
  initialVariant,
  children,
}: {
  initialVariant: ProductVariant | null;
  children: ReactNode;
}) {
  const [variant, select] = useState(initialVariant);
  return (
    <SelectionContext.Provider value={{ variant, select }}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useProductSelection() {
  return useContext(SelectionContext);
}
