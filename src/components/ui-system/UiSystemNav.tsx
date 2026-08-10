"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/ui-system", label: "Overview", exact: true },
  { href: "/ui-system/button", label: "Button", exact: false },
] as const;

export function UiSystemNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-row gap-2 lg:flex-col lg:gap-1">
      {navItems.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={[
              "rounded-full px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-brand text-brand-foreground"
                : "text-brand/80 hover:bg-brand/5 hover:text-brand",
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
