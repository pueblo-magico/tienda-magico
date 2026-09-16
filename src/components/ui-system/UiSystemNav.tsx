"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const groups = [
  {
    title: "Foundation",
    items: [
      { href: "/ui-system", label: "Overview", exact: true },
      { href: "/ui-system/example", label: "Usage example" },
      { href: "/ui-system/tokens", label: "Tokens" },
    ],
  },
  {
    title: "Layout",
    items: [
      { href: "/ui-system/container", label: "Container" },
      { href: "/ui-system/section", label: "Section" },
    ],
  },
  {
    title: "Typography",
    items: [{ href: "/ui-system/typography", label: "Typography" }],
  },
  {
    title: "Actions",
    items: [
      { href: "/ui-system/button", label: "Button" },
      { href: "/ui-system/icons", label: "Iconos" },
    ],
  },
  {
    title: "Forms",
    items: [
      { href: "/ui-system/input", label: "Input" },
      { href: "/ui-system/select", label: "Select" },
      { href: "/ui-system/textarea", label: "Textarea" },
      { href: "/ui-system/slider", label: "Slider" },
    ],
  },
  {
    title: "Feedback",
    items: [
      { href: "/ui-system/badge", label: "Badge" },
      { href: "/ui-system/modal", label: "Modal" },
      { href: "/ui-system/drawer", label: "Drawer" },
      { href: "/ui-system/accordion", label: "Accordion" },
      { href: "/ui-system/tabs", label: "Tabs" },
    ],
  },
  {
    title: "Cards",
    items: [
      { href: "/ui-system/card", label: "Card (shadcn/ui)" },
      { href: "/ui-system/product-card", label: "ProductCard" },
      { href: "/ui-system/article-card", label: "ArticleCard" },
      { href: "/ui-system/impact-card", label: "ImpactCard" },
      { href: "/ui-system/info-card", label: "InfoCard" },
    ],
  },
] as const;

export function UiSystemNav() {
  const pathname = usePathname();

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="text-forest/45 mb-2 text-[11px] font-medium tracking-[0.16em] uppercase">
            {group.title}
          </p>
          <nav className="flex flex-row flex-wrap gap-1 lg:flex-col">
            {group.items.map((item) => {
              const isActive =
                "exact" in item && item.exact
                  ? pathname === item.href
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-forest text-brand-foreground"
                      : "text-forest/75 hover:bg-forest/5 hover:text-forest",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
    </div>
  );
}
