"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { CollectionSummary, TagReference } from "@/types/commerce";
import { cn } from "@/lib/utils/cn";
import { SlidersHorizontal } from "lucide-react";
import { buildShopHref, type ShopQuery } from "./search-params";
import { buildCategoryTree, type CategoryTreeNode } from "./category-hierarchy";

function CategoryOptions({
  nodes,
  selectedHandle,
}: {
  nodes: CategoryTreeNode[];
  selectedHandle: string;
}) {
  return (
    <ul className="space-y-2">
      {nodes.map(({ category, children }) => (
        <li key={category.id}>
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <input
              type="radio"
              name="collection"
              value={category.handle}
              defaultChecked={selectedHandle === category.handle}
              className="accent-brand"
            />
            {category.title}
          </label>
          {children.length ? (
            <div className="border-border mt-2 ml-2 border-l pl-5">
              <CategoryOptions
                nodes={children}
                selectedHandle={selectedHandle}
              />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

type Props = {
  locale: string;
  collections: CollectionSummary[];
  tags: TagReference[];
  query: ShopQuery;
  labels: {
    all: string;
    collections: string;
    price: string;
    tags: string;
    minPrice: string;
    maxPrice: string;
    apply: string;
    clear: string;
    filters: string;
  };
};

export function ShopFilters({
  locale,
  collections,
  tags,
  query,
  labels,
}: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const categoryTree = buildCategoryTree(collections);

  const submit = (form: HTMLFormElement) => {
    const data = new FormData(form);
    startTransition(() =>
      router.push(
        buildShopHref(
          locale,
          {
            ...query,
            collection: String(data.get("collection") ?? ""),
            minPrice: String(data.get("minPrice") ?? ""),
            maxPrice: String(data.get("maxPrice") ?? ""),
            tags: data.getAll("tags").map(String),
            after: "",
          },
          { dropAfter: true },
        ),
      ),
    );
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="border-border bg-card flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium lg:hidden"
        aria-expanded={isOpen}
      >
        <span className="inline-flex items-center gap-2"><SlidersHorizontal aria-hidden className="size-4" />{labels.filters}</span>
        <span>{isOpen ? "−" : "+"}</span>
      </button>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(event.currentTarget);
        }}
        className={cn(
          "space-y-7 pt-5 lg:block lg:pt-0",
          isOpen ? "block" : "hidden",
        )}
      >
        <fieldset className="space-y-3">
          <legend className="font-navigation text-text-black text-lg">
            {labels.collections}
          </legend>
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <input
              type="radio"
              name="collection"
              value=""
              defaultChecked={!query.collection}
              className="accent-brand"
            />
            {labels.all}
          </label>
          <CategoryOptions
            nodes={categoryTree}
            selectedHandle={query.collection}
          />
        </fieldset>
        <fieldset className="border-border space-y-3 border-t pt-5">
          <legend className="font-navigation text-text-black text-lg">
            {labels.price}
          </legend>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-muted text-xs">
              {labels.minPrice}
              <input
                name="minPrice"
                type="number"
                min="0"
                defaultValue={query.minPrice}
                className="border-border bg-card mt-1 h-10 w-full rounded-lg border px-3 text-sm"
              />
            </label>
            <label className="text-muted text-xs">
              {labels.maxPrice}
              <input
                name="maxPrice"
                type="number"
                min="0"
                defaultValue={query.maxPrice}
                className="border-border bg-card mt-1 h-10 w-full rounded-lg border px-3 text-sm"
              />
            </label>
          </div>
        </fieldset>
        {tags.length ? (
          <fieldset className="border-border space-y-3 border-t pt-5">
            <legend className="font-navigation text-text-black text-lg">
              {labels.tags}
            </legend>
            <div className="space-y-2">
              {tags.map((tag) => (
                <label
                  key={tag.id}
                  className="flex cursor-pointer items-center gap-3 text-sm"
                >
                  <input
                    type="checkbox"
                    name="tags"
                    value={tag.handle}
                    defaultChecked={query.tags.includes(tag.handle)}
                    className="accent-brand"
                  />
                  {tag.label}
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}
        <div className="flex gap-2">
          <button
            disabled={pending}
            className="bg-brand text-brand-foreground h-10 flex-1 rounded-full px-4 text-xs font-medium tracking-wider uppercase"
          >
            {labels.apply}
          </button>
          <button
            type="button"
            onClick={() =>
              startTransition(() =>
                router.push(
                  buildShopHref(
                    locale,
                    {
                      q: query.q,
                      sort: query.sort,
                      collection: "",
                      minPrice: "",
                      maxPrice: "",
                      tags: [],
                      after: "",
                    },
                    { dropAfter: true },
                  ),
                ),
              )
            }
            className="text-muted h-10 rounded-full px-3 text-xs tracking-wider uppercase"
          >
            {labels.clear}
          </button>
        </div>
      </form>
    </div>
  );
}
