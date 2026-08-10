"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export type CartButtonProps = {
  count?: number;
  href?: string;
  className?: string;
  onClick?: () => void;
};

export function CartButton({
  count = 0,
  href = "/cart",
  className,
  onClick,
}: CartButtonProps) {
  const content = (
    <>
      <span className="sr-only">Open cart</span>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <path d="M6 7h12l-1 12H7L6 7Z" />
        <path d="M9 7a3 3 0 0 1 6 0" />
      </svg>
      {count > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-clay px-1 text-[10px] font-semibold text-brand-foreground">
          {count}
        </span>
      ) : null}
    </>
  );

  const classes = cn(
    "relative inline-flex h-10 w-10 items-center justify-center rounded-full text-current transition-colors hover:bg-current/10",
    className,
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes} aria-label="Open cart">
        {content}
      </button>
    );
  }

  return (
    <Link href={href} className={classes} aria-label="Open cart">
      {content}
    </Link>
  );
}
