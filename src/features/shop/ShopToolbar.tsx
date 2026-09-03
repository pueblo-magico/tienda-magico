"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DEFAULT_SHOP_SORT, type ShopSortValue } from "./constants";
import { buildShopHref, type ShopQuery } from "./search-params";

type Props = {
  locale: string;
  query: ShopQuery;
  labels: {
    search: string;
    searchPlaceholder: string;
    sort: string;
    submit: string;
    clear: string;
    sortBest: string;
    sortNewest: string;
    sortTitleAsc: string;
    sortTitleDesc: string;
    sortPriceAsc: string;
    sortPriceDesc: string;
  };
};

export function ShopToolbar({ locale, query, labels }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const sortOptions = [
    { value: "best", label: labels.sortBest },
    { value: "newest", label: labels.sortNewest },
    { value: "title-asc", label: labels.sortTitleAsc },
    { value: "title-desc", label: labels.sortTitleDesc },
    { value: "price-asc", label: labels.sortPriceAsc },
    { value: "price-desc", label: labels.sortPriceDesc },
  ];

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const q = String(form.get("q") ?? "").trim();
        const sort = String(
          form.get("sort") ?? DEFAULT_SHOP_SORT,
        ) as ShopSortValue;

        const href = buildShopHref(
          locale,
          {
            ...query,
            q,
            sort,
            after: "",
          },
          { dropAfter: true },
        );

        startTransition(() => {
          router.push(href);
        });
      }}
    >
      <Input
        name="q"
        defaultValue={query.q}
        label={labels.search}
        placeholder={labels.searchPlaceholder}
        className="sm:flex-1"
      />
      <Select
        name="sort"
        label={labels.sort}
        defaultValue={query.sort}
        options={sortOptions}
        className="sm:w-52"
      />
      <div className="flex gap-2 sm:pb-0.5">
        <Button type="submit" disabled={pending}>
          {labels.submit}
        </Button>
        {query.q || query.sort !== DEFAULT_SHOP_SORT ? (
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => {
              startTransition(() => {
                router.push(
                  buildShopHref(
                    locale,
                    {
                      ...query,
                      q: "",
                      sort: DEFAULT_SHOP_SORT,
                      after: "",
                    },
                    { dropAfter: true },
                  ),
                );
              });
            }}
          >
            {labels.clear}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
