"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { locales, type Locale } from "@/config/navigation";
import { cn } from "@/lib/utils/cn";

function swapLocaleInPath(pathname: string, nextLocale: Locale) {
  const segments = pathname.split("/");
  if (segments.length > 1 && locales.includes(segments[1] as Locale)) {
    segments[1] = nextLocale;
    return segments.join("/") || "/";
  }
  return `/${nextLocale}${pathname === "/" ? "" : pathname}`;
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
