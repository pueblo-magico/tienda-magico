"use client";

import Link from "next/link";
import { BrandLogo } from "./BrandLogo";
import type { CommerceImage } from "@/types/commerce";
import { useEffect } from "react";
import { cn } from "@/lib/utils/cn";
import { LanguageSwitcher } from "./LanguageSwitcher";

export type MobileMenuItem = {
  href: string;
  isActive: boolean;
  label: string;
};

export type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
  items: MobileMenuItem[];
  homeHref: string;
  logo?: CommerceImage | null;
  siteName?: string;
};

export function MobileMenu({
  open,
  onClose,
  items,
  homeHref,
  logo,
  siteName,
}: MobileMenuProps) {
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
          "bg-forest/50 absolute inset-0 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        className={cn(
          "bg-cream absolute inset-0 flex flex-col transition-transform duration-300 ease-out",
          open ? "translate-y-0" : "-translate-y-full",
        )}
      >
        <div className="border-border flex items-center justify-between border-b px-4 py-4">
          <Link
            href={homeHref}
            prefetch={false}
            onClick={onClose}
            className="inline-flex items-center"
          >
            <BrandLogo logo={logo} name={siteName} className="h-12 w-auto" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="text-forest/70 hover:bg-forest/5 rounded-full px-3 py-2 text-sm tracking-[0.02em]"
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
              aria-current={item.isActive ? "page" : undefined}
              onClick={onClose}
              className={cn(
                "font-navigation border-border/70 text-forest border-b py-4 text-base font-normal transition-all",
                item.isActive &&
                  "text-text-highlight border-text-highlight font-bold",
                open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
              )}
              style={{ transitionDelay: open ? `${80 + index * 40}ms` : "0ms" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-border border-t px-6 py-5">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}
