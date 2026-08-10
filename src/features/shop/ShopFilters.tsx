import Link from "next/link";
import type { CollectionSummary } from "@/types/commerce";
import { cn } from "@/lib/utils/cn";
import { buildShopHref, type ShopQuery } from "./search-params";

type Props = {
  locale: string;
  collections: CollectionSummary[];
  query: ShopQuery;
  labels: {
    all: string;
    collections: string;
  };
};

export function ShopFilters({ locale, collections, query, labels }: Props) {
  if (!collections.length) return null;

  return (
    <nav aria-label={labels.collections} className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
        {labels.collections}
      </p>
      <ul className="flex flex-wrap gap-2 lg:flex-col">
        <li>
          <Link
            href={buildShopHref(
              locale,
              { ...query, collection: "", after: "" },
              { dropAfter: true },
            )}
            className={cn(
              "inline-flex rounded-full border px-3 py-1.5 text-sm transition-colors",
              !query.collection
                ? "border-forest bg-forest text-brand-foreground"
                : "border-border bg-card text-forest hover:border-forest/40",
            )}
          >
            {labels.all}
          </Link>
        </li>
        {collections.map((collection) => {
          const active = query.collection === collection.handle;
          return (
            <li key={collection.id}>
              <Link
                href={buildShopHref(
                  locale,
                  {
                    ...query,
                    collection: collection.handle,
                    after: "",
                  },
                  { dropAfter: true },
                )}
                className={cn(
                  "inline-flex rounded-full border px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "border-forest bg-forest text-brand-foreground"
                    : "border-border bg-card text-forest hover:border-forest/40",
                )}
              >
                {collection.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
