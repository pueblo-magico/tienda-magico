import Link from "next/link";
import type { Paginated } from "@/types/commerce";
import { cn } from "@/lib/utils/cn";
import { buildShopHref, type ShopQuery } from "./search-params";

type Props = {
  locale: string;
  query: ShopQuery;
  pageInfo: Paginated<unknown>["pageInfo"];
  labels: {
    previous: string;
    next: string;
    pagination: string;
  };
};

export function ShopPagination({ locale, query, pageInfo, labels }: Props) {
  if (!pageInfo.hasNextPage && !pageInfo.hasPreviousPage) {
    return null;
  }

  // Payload uses numeric page cursors; "previous" goes to page-1 or clears.
  const previousAfter = (() => {
    if (!pageInfo.hasPreviousPage) return null;
    const current = Number.parseInt(query.after || "1", 10);
    if (Number.isFinite(current) && current > 2) {
      return String(current - 1);
    }
    // Shopify: no cheap prev cursor without history — jump to first page
    if (query.after && !Number.isFinite(current)) {
      return "";
    }
    return "";
  })();

  const nextAfter = pageInfo.hasNextPage ? pageInfo.endCursor : null;

  const linkClass =
    "inline-flex h-10 items-center justify-center rounded-full border border-border px-4 text-sm font-medium uppercase tracking-[0.1em] transition-colors hover:border-forest/40 disabled:pointer-events-none disabled:opacity-40";

  return (
    <nav
      aria-label={labels.pagination}
      className="flex flex-wrap items-center justify-between gap-3 pt-2"
    >
      {pageInfo.hasPreviousPage ? (
        <Link
          href={buildShopHref(locale, {
            ...query,
            after: previousAfter || "",
          })}
          className={linkClass}
        >
          {labels.previous}
        </Link>
      ) : (
        <span className={cn(linkClass, "opacity-40")}>{labels.previous}</span>
      )}

      {nextAfter ? (
        <Link
          href={buildShopHref(locale, {
            ...query,
            after: nextAfter,
          })}
          className={linkClass}
        >
          {labels.next}
        </Link>
      ) : (
        <span className={cn(linkClass, "opacity-40")}>{labels.next}</span>
      )}
    </nav>
  );
}
