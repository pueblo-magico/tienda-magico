"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  localizePath,
  mainNavigation,
  resolveNavigationHref,
  type Locale,
} from "@/config/navigation";
import { cn } from "@/lib/utils/cn";
import { useCart } from "@/features/cart";
import { CartButton } from "./CartButton";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileMenu } from "./MobileMenu";

export function Header({ className }: { className?: string }) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const { openCart, itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const homeHref = localizePath(locale);

  const items = mainNavigation.map((item) => {
    return {
      ...item,
      href: resolveNavigationHref(item, locale),
      label: t(item.labelKey),
    };
  });

  return (
    <>
      <header
        className={cn(
          "border-forest/10 bg-forest text-brand-foreground sticky top-0 z-40 border-b",
          className,
        )}
      >
        <div className="mx-auto flex h-[var(--header-height)] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10 lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen(true)}
            >
              <span className="sr-only">Open menu</span>
              <span aria-hidden className="flex flex-col gap-1.5">
                <span className="block h-px w-5 bg-current" />
                <span className="block h-px w-5 bg-current" />
                <span className="block h-px w-4 bg-current" />
              </span>
            </button>

            <Link
              href={homeHref}
              className="font-serif text-lg tracking-[0.08em] sm:text-xl"
            >
              Pueblo Mágico
            </Link>
          </div>

          <nav
            className="hidden items-center gap-1 lg:flex"
            aria-label="Primary"
          >
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-brand-foreground/85 hover:text-brand-foreground rounded-full px-3 py-2 text-xs font-medium tracking-[0.14em] uppercase transition-colors hover:bg-white/10"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <div className="hidden sm:block">
              <LanguageSwitcher className="border-brand-foreground/25 text-brand-foreground" />
            </div>
            <CartButton
              count={itemCount}
              onClick={openCart}
              className="text-brand-foreground hover:bg-white/10"
            />
          </div>
        </div>
      </header>

      <div id="mobile-menu">
        <MobileMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          items={items}
          homeHref={homeHref}
        />
      </div>
    </>
  );
}
