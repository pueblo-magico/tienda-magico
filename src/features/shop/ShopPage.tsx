import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Body, Eyebrow, PageTitle } from "@/components/typography";
import { loadShopCatalog } from "./load-shop-catalog";
import { ProductGrid } from "./ProductGrid";
import { ShopFilters } from "./ShopFilters";
import { ShopPagination } from "./ShopPagination";
import { ShopToolbar } from "./ShopToolbar";
import type { ShopQuery } from "./search-params";
import { buildShopHref } from "./search-params";
import type { CategoryReference } from "@/types/commerce";
import { CategoryIcon } from "@/components/CategoryIcon";
import { ArrowRight } from "lucide-react";
import { directChildCategories } from "./category-hierarchy";

type Labels = {
  eyebrow: string;
  title: string;
  subtitle: string;
  notConfigured: string;
  empty: string;
  emptyFiltered: string;
  error: string;
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
  collections: string;
  allCollections: string;
  filters: string;
  price: string;
  tags: string;
  minPrice: string;
  maxPrice: string;
  previous: string;
  next: string;
  pagination: string;
  subcategories: string;
  noMedia: string;
};

type Props = {
  locale: string;
  query: ShopQuery;
  labels: Labels;
};

export async function ShopPage({ locale, query, labels }: Props) {
  const t = await getTranslations("shop");
  const catalog = await loadShopCatalog(locale, query);
  const hasFilters = Boolean(
    query.q ||
    query.collection ||
    query.minPrice ||
    query.maxPrice ||
    query.tags.length,
  );
  const count = catalog.products.items.length;
  const categoryParents: CategoryReference[] = [];
  let categoryParent = catalog.selectedCollection?.parent ?? null;
  while (categoryParent) {
    categoryParents.unshift(categoryParent);
    categoryParent = categoryParent.parent;
  }
  const categoryCards = catalog.selectedCollection
    ? directChildCategories(catalog.collections, catalog.selectedCollection.id)
    : catalog.collections
        .filter((collection) => !collection.parent)
        .slice(0, 4);

  return (
    <Section spacing="lg">
      <Container className="space-y-9">
        <header className="border-border bg-warm relative overflow-hidden rounded-3xl border px-6 py-12 sm:px-12 lg:py-16">
          {catalog.selectedCollection?.image?.url ? (
            <>
              <Image
                src={catalog.selectedCollection.image.url}
                alt=""
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1280px) 100vw, 1280px"
              />
              <div className="bg-forest/65 absolute inset-0" />
            </>
          ) : null}
          <div className="relative z-10 max-w-xl space-y-3">
            {!catalog.selectedCollection?.image?.url &&
            catalog.selectedCollection?.icon ? (
              <div className="text-text-secondary" aria-hidden="true">
                <CategoryIcon name={catalog.selectedCollection.icon} />
              </div>
            ) : null}
            {categoryParents.length ? (
              <nav
                aria-label={labels.collections}
                className={
                  catalog.selectedCollection?.image?.url
                    ? "text-card/80 flex flex-wrap gap-2 text-xs"
                    : "text-muted flex flex-wrap gap-2 text-xs"
                }
              >
                <Link
                  href={buildShopHref(locale, { ...query, collection: "" })}
                >
                  {labels.allCollections}
                </Link>
                {categoryParents.map((parent) => (
                  <span key={parent.id} className="contents">
                    <span aria-hidden>/</span>
                    <Link
                      href={buildShopHref(locale, {
                        ...query,
                        collection: parent.handle,
                        after: "",
                      })}
                    >
                      {parent.title}
                    </Link>
                  </span>
                ))}
              </nav>
            ) : null}
            <Eyebrow
              className={
                catalog.selectedCollection?.image?.url ? "text-gold" : undefined
              }
            >
              {labels.eyebrow}
            </Eyebrow>
            <PageTitle
              as="h1"
              className={
                catalog.selectedCollection?.image?.url
                  ? "text-card text-4xl sm:text-5xl"
                  : "text-4xl sm:text-5xl"
              }
            >
              {catalog.selectedCollection?.title ?? labels.title}
            </PageTitle>
            <Body
              size="lg"
              className={
                catalog.selectedCollection?.image?.url
                  ? "text-card/85"
                  : "text-muted"
              }
            >
              {catalog.selectedCollection?.description || labels.subtitle}
            </Body>
          </div>
          <div
            aria-hidden
            className="bg-brand/8 absolute -top-24 -right-16 h-72 w-72 rounded-full"
          />
          <div
            aria-hidden
            className="border-brand/20 absolute right-20 -bottom-28 h-52 w-52 rounded-full border"
          />
        </header>

        {categoryCards.length ? (
          <nav
            aria-label={
              catalog.selectedCollection
                ? labels.subcategories
                : labels.collections
            }
            className="space-y-4"
          >
            {catalog.selectedCollection ? (
              <Eyebrow>{labels.subcategories}</Eyebrow>
            ) : null}
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {categoryCards.map((collection) => (
                <li key={collection.id}>
                  <Link
                    href={buildShopHref(locale, {
                      ...query,
                      collection: collection.handle,
                      after: "",
                    })}
                    aria-current={
                      query.collection === collection.handle
                        ? "page"
                        : undefined
                    }
                    className="border-border bg-card hover:bg-card-hover aria-[current=page]:border-brand flex min-h-20 items-center gap-4 rounded-xl border p-4 transition-colors"
                  >
                    <span className="border-border bg-background-primary relative h-12 w-12 shrink-0 overflow-hidden rounded-full border">
                      {collection.image?.url ? (
                        <Image
                          src={collection.image.url}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : collection.icon ? (
                        <span className="text-text-secondary flex size-full items-center justify-center">
                          <CategoryIcon name={collection.icon} />
                        </span>
                      ) : null}
                    </span>
                    <span className="font-serif text-lg">
                      {collection.title}
                    </span>
                    <ArrowRight aria-hidden className="ml-auto size-4" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        {!catalog.configured ? (
          <Body className="text-muted">{labels.notConfigured}</Body>
        ) : null}

        {catalog.error ? (
          <p className="border-clay/30 bg-clay/10 rounded-xl border px-4 py-3 text-sm">
            {labels.error}: {catalog.error}
          </p>
        ) : null}

        {catalog.configured ? (
          <div className="grid gap-8 lg:grid-cols-[15rem_1fr]">
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <ShopFilters
                locale={locale}
                collections={catalog.collections}
                tags={catalog.availableTags}
                query={query}
                labels={{
                  all: labels.allCollections,
                  collections: labels.collections,
                  filters: labels.filters,
                  price: labels.price,
                  tags: labels.tags,
                  minPrice: labels.minPrice,
                  maxPrice: labels.maxPrice,
                  apply: labels.submit,
                  clear: labels.clear,
                }}
              />
            </aside>

            <div className="space-y-6">
              <ShopToolbar
                locale={locale}
                query={query}
                labels={{
                  search: labels.search,
                  searchPlaceholder: labels.searchPlaceholder,
                  sort: labels.sort,
                  submit: labels.submit,
                  clear: labels.clear,
                  sortBest: labels.sortBest,
                  sortNewest: labels.sortNewest,
                  sortTitleAsc: labels.sortTitleAsc,
                  sortTitleDesc: labels.sortTitleDesc,
                  sortPriceAsc: labels.sortPriceAsc,
                  sortPriceDesc: labels.sortPriceDesc,
                }}
              />

              {count > 0 ? (
                <p className="text-muted text-sm">{t("results", { count })}</p>
              ) : null}

              {count === 0 ? (
                <Body className="text-muted">
                  {hasFilters ? labels.emptyFiltered : labels.empty}
                </Body>
              ) : (
                <ProductGrid
                  locale={locale}
                  products={catalog.products.items}
                  noMediaLabel={labels.noMedia}
                />
              )}

              <ShopPagination
                locale={locale}
                query={query}
                pageInfo={catalog.products.pageInfo}
                labels={{
                  previous: labels.previous,
                  next: labels.next,
                  pagination: labels.pagination,
                }}
              />
            </div>
          </div>
        ) : null}
      </Container>
    </Section>
  );
}
