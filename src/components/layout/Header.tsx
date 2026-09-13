"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  localizePath,
  mainNavigation,
  isNavigationItemActive,
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
  const pathname = usePathname();
  const { openCart, itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const homeHref = localizePath(locale, "/shop");

  useEffect(() => {
    const updateCompactState = () => setIsCompact(window.scrollY > 24);

    updateCompactState();
    window.addEventListener("scroll", updateCompactState, { passive: true });
    return () => window.removeEventListener("scroll", updateCompactState);
  }, []);

  const items = mainNavigation.map((item) => {
    return {
      ...item,
      href: resolveNavigationHref(item, locale),
      isActive: isNavigationItemActive(item, locale, pathname),
      label: t(item.labelKey),
    };
  });

  return (
    <>
      <header
        className={cn(
          "border-border bg-card text-text-black sticky top-0 z-40 border-b",
          className,
        )}
      >
        <div
          className={cn(
            "mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 transition-[height] duration-200 sm:px-6",
            isCompact ? "h-[3.75rem] sm:h-18" : "h-20 sm:h-24",
          )}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="hover:bg-card-hover inline-flex h-10 w-10 items-center justify-center rounded-full lg:hidden"
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
              prefetch={false}
              className="inline-flex shrink-0 items-center"
            >
              <Image
                src="/pueblo_magico_logo_marron.svg"
                alt="Pueblo Mágico"
                width={134}
                height={65}
                priority
                className={cn(
                  "w-auto transition-[height] duration-200",
                  isCompact ? "h-9 sm:h-[2.625rem]" : "h-12 sm:h-14",
                )}
              />
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
                aria-current={item.isActive ? "page" : undefined}
                className={cn(
                  "font-navigation-desktop hover:bg-card-hover rounded-full px-3 py-2 text-[13px] tracking-normal transition-colors",
                  item.isActive
                    ? "bg-card-hover text-text-highlight font-bold"
                    : "text-text-black hover:text-text-secondary font-light",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <div className="hidden sm:block">
              <LanguageSwitcher className="border-border text-text-black" />
            </div>
            <CartButton
              count={itemCount}
              onClick={openCart}
              className="text-text-black hover:bg-card-hover"
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
