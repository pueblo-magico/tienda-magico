"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type SearchButtonProps = {
  label: string;
  onClick: () => void;
  className?: string;
};

export function SearchButton({ label, onClick, className }: SearchButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "relative inline-flex h-10 w-10 items-center justify-center rounded-full text-current transition-colors hover:bg-current/10",
        className,
      )}
    >
      <Search aria-hidden className="size-5" strokeWidth={1.6} />
    </button>
  );
}
