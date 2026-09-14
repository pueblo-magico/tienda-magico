"use client";

import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";
import { Slider } from "@/components/ui";
import type { CollectionSummary, TagReference } from "@/types/commerce";
import { cn } from "@/lib/utils/cn";
import { buildShopHref, type ShopQuery } from "./search-params";
import { buildCategoryTree, type CategoryTreeNode } from "./category-hierarchy";

function FilterSection({
  title,
  children,
  open = true,
}: {
  title: string;
  children: ReactNode;
  open?: boolean;
}) {
  return (
    <details className="group border-border border-t py-4" open={open}>
      <summary className="text-text-black flex cursor-pointer list-none items-center justify-between text-sm font-bold">
        {title}
        <ChevronDown
          aria-hidden
          className="size-4 transition-transform group-open:rotate-180"
          strokeWidth={2}
        />
      </summary>
      <div className="mt-3 space-y-2">{children}</div>
    </details>
  );
}

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
          <label className="text-text-primary flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="collection"
              value={category.handle}
              defaultChecked={selectedHandle === category.handle}
              className="border-border accent-brand size-4 rounded"
            />
            {category.title}
          </label>
          {children.length ? (
            <div className="mt-2 ml-6">
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
  origins: Array<{ value: string; label: string }>;
  priceBounds: { min: number; max: number };
  query: ShopQuery;
  labels: {
    collections: string;
    price: string;
    minPrice: string;
    maxPrice: string;
    characteristics: string;
    origin: string;
    availability: string;
    availableOnly: string;
    clearAll: string;
    filters: string;
  };
};

export function ShopFilters({
  locale,
  collections,
  tags,
  origins,
  priceBounds,
  query,
  labels,
}: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const priceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const categoryTree = buildCategoryTree(collections);
  const maximumPrice = Math.max(priceBounds.max, 1);
  const [priceRange, setPriceRange] = useState({
    min: Number(query.minPrice || priceBounds.min),
    max: Number(query.maxPrice || maximumPrice),
  });
  const formatPrice = (value: number) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);

  const applyFilters = (form: HTMLFormElement) => {
    const data = new FormData(form);
    startTransition(() =>
      router.replace(
        buildShopHref(
          locale,
          {
            ...query,
            collection: String(data.get("collection") ?? ""),
            minPrice: String(data.get("minPrice") ?? ""),
            maxPrice: String(data.get("maxPrice") ?? ""),
            tags: data.getAll("tags").map(String),
            origins: data.getAll("origins").map(String),
            availableOnly: data.get("availability") === "available",
            after: "",
          },
          { dropAfter: true },
        ),
        { scroll: false },
      ),
    );
  };

  const handleChange = (event: FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget;
    const target = event.target as HTMLInputElement;
    if (target.name === "collection" && target.checked) {
      form
        .querySelectorAll<HTMLInputElement>('input[name="collection"]')
        .forEach((input) => {
          if (input !== target) input.checked = false;
        });
    }
    if (priceTimerRef.current) clearTimeout(priceTimerRef.current);
    applyFilters(form);
  };

  const clearFilters = () => {
    if (priceTimerRef.current) clearTimeout(priceTimerRef.current);
    const form = formRef.current;
    setPriceRange({ min: priceBounds.min, max: maximumPrice });
    form?.querySelectorAll<HTMLInputElement>("input").forEach((input) => {
      if (input.type === "checkbox") input.checked = false;
      if (input.name === "minPrice") input.value = String(priceBounds.min);
      if (input.name === "maxPrice") input.value = String(maximumPrice);
    });
    startTransition(() =>
      router.replace(
        buildShopHref(
          locale,
          {
            q: query.q,
            sort: query.sort,
            collection: "",
            minPrice: "",
            maxPrice: "",
            tags: [],
            origins: [],
            availableOnly: false,
            after: "",
          },
          { dropAfter: true },
        ),
        { scroll: false },
      ),
    );
  };

  const optionClassName =
    "text-text-primary flex cursor-pointer items-center gap-2 text-sm";
  const checkboxClassName = "border-border size-4 rounded accent-brand";
  const updatePriceRange = ([min, max]: number[]) => {
    setPriceRange({ min, max });
    if (priceTimerRef.current) clearTimeout(priceTimerRef.current);
    priceTimerRef.current = setTimeout(() => {
      if (formRef.current) applyFilters(formRef.current);
    }, 250);
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="border-border bg-card flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-bold lg:hidden"
        aria-expanded={isOpen}
      >
        <span className="inline-flex items-center gap-2">
          <SlidersHorizontal aria-hidden className="size-4" />
          {labels.filters}
        </span>
        <ChevronDown
          aria-hidden
          className={cn("size-4 transition-transform", isOpen && "rotate-180")}
        />
      </button>
      <form
        ref={formRef}
        onChange={handleChange}
        className={cn(
          "border-border bg-card mt-3 rounded-xl border px-5 transition-opacity lg:mt-0 lg:block",
          isOpen ? "block" : "hidden",
          pending && "opacity-60",
        )}
      >
        <div className="flex items-center justify-between py-4">
          <h2 className="font-serif text-lg">{labels.filters}</h2>
          <button
            type="button"
            onClick={clearFilters}
            className="text-text-secondary hover:text-text-black text-xs underline underline-offset-2"
          >
            {labels.clearAll}
          </button>
        </div>
        <FilterSection title={labels.collections}>
          <CategoryOptions
            nodes={categoryTree}
            selectedHandle={query.collection}
          />
        </FilterSection>
        <FilterSection title={labels.price}>
          <input name="minPrice" type="hidden" value={priceRange.min} />
          <input name="maxPrice" type="hidden" value={priceRange.max} />
          <Slider
            aria-label={labels.price}
            minValue={priceBounds.min}
            maxValue={maximumPrice}
            step={Math.max(Math.round(maximumPrice / 100), 1)}
            value={[priceRange.min, priceRange.max]}
            thumbLabels={[labels.minPrice, labels.maxPrice]}
            onChange={updatePriceRange}
          />
          <div className="text-text-secondary flex justify-between text-xs">
            <span>{formatPrice(priceRange.min)}</span>
            <span>{formatPrice(priceRange.max)}</span>
          </div>
        </FilterSection>
        {origins.length ? (
          <FilterSection title={labels.origin}>
            {origins.map((origin) => (
              <label key={origin.value} className={optionClassName}>
                <input
                  type="checkbox"
                  name="origins"
                  value={origin.value}
                  defaultChecked={query.origins.includes(origin.value)}
                  className={checkboxClassName}
                />
                {origin.label}
              </label>
            ))}
          </FilterSection>
        ) : null}
        {tags.length ? (
          <FilterSection title={labels.characteristics}>
            {tags.map((tag) => (
              <label key={tag.id} className={optionClassName}>
                <input
                  type="checkbox"
                  name="tags"
                  value={tag.handle}
                  defaultChecked={query.tags.includes(tag.handle)}
                  className={checkboxClassName}
                />
                {tag.label}
              </label>
            ))}
          </FilterSection>
        ) : null}
        <FilterSection title={labels.availability} open={false}>
          <label className={optionClassName}>
            <input
              type="checkbox"
              name="availability"
              value="available"
              defaultChecked={query.availableOnly}
              className={checkboxClassName}
            />
            {labels.availableOnly}
          </label>
        </FilterSection>
      </form>
    </div>
  );
}
