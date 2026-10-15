"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Select } from "@pueblo-magico/react-ui";
import type { ShopSortValue } from "./constants";
import { buildShopHref, type ShopQuery } from "./search-params";

type Props = {
  locale: string;
  query: ShopQuery;
  labels: {
    sort: string;
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
    <div className="flex justify-end">
      <Select
        name="sort"
        label={labels.sort}
        placeholder={labels.sort}
        buttonClassName="h-9 rounded-md px-3 text-xs"
        value={query.sort}
        options={sortOptions}
        isDisabled={pending}
        className="w-52"
        onChange={(value) => {
          if (!value) return;
          const sort = value as ShopSortValue;
          startTransition(() => {
            router.replace(
              buildShopHref(
                locale,
                { ...query, sort, after: "" },
                { dropAfter: true },
              ),
              { scroll: false },
            );
          });
        }}
      />
    </div>
  );
}
