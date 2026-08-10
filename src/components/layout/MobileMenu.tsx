"use client";

import Link from "next/link";
import { useEffect } from "react";
import { cn } from "@/lib/utils/cn";
import { LanguageSwitcher } from "./LanguageSwitcher";

export type MobileMenuItem = {
  href: string;
  label: string;
};

export type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
  items: MobileMenuItem[];
  homeHref: string;
};

export function MobileMenu({ open, onClose, items, homeHref }: MobileMenuProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 lg:hidden",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      <div
        className={cn(
          "absolute inset-0 bg-forest/50 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        className={cn(
          "absolute inset-0 flex flex-col bg-cream transition-transform duration-300 ease-out",
          open ? "translate-y-0" : "-translate-y-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <Link
            href={homeHref}
            onClick={onClose}
            className="font-serif text-xl tracking-wide text-forest"
          >
            Pueblo Mágico
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-2 text-sm uppercase tracking-[0.12em] text-forest/70 hover:bg-forest/5"
            aria-label="Close menu"
          >
            Close
          </button>
        </div>

        <nav className="flex flex-1 flex-col justify-center gap-2 px-6">
          {items.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "border-b border-border/70 py-4 font-serif text-3xl text-forest transition-all",
                open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
              )}
              style={{ transitionDelay: open ? `${80 + index * 40}ms` : "0ms" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border px-6 py-5">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}
