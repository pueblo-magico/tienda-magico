"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import {
  internalPath,
  localizePath,
  locales,
  type Locale,
} from "@/config/navigation";
import { cn } from "@/lib/utils/cn";

function swapLocaleInPath(pathname: string, nextLocale: Locale) {
  return localizePath(nextLocale, internalPath(pathname));
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale() as Locale;
  const pathname = usePathname() || "/";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-current/25 p-1 text-xs uppercase tracking-[0.12em]",
        className,
      )}
      aria-label="Language switcher"
    >
      {locales.map((item) => {
        const active = item === locale;
        return (
          <Link
            key={item}
            href={swapLocaleInPath(pathname, item)}
            hrefLang={item}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-2.5 py-1 transition-colors",
              active
                ? "bg-brand-foreground text-forest"
                : "text-current/75 hover:text-current",
            )}
          >
            {item}
          </Link>
        );
      })}
    </div>
  );
}
