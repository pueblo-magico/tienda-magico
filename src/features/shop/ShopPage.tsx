import { getTranslations } from "next-intl/server";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Body, Eyebrow, PageTitle } from "@/components/typography";
import { loadShopCatalog } from "./load-shop-catalog";
import { ProductGrid } from "./ProductGrid";
import { ShopFilters } from "./ShopFilters";
import { ShopPagination } from "./ShopPagination";
import { ShopToolbar } from "./ShopToolbar";
import type { ShopQuery } from "./search-params";

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

  return (
    <Section spacing="lg">
      <Container className="space-y-9">
        <header className="border-border bg-warm relative overflow-hidden rounded-3xl border px-6 py-12 sm:px-12 lg:py-16">
          <div className="relative z-10 max-w-xl space-y-3">
            <Eyebrow>{labels.eyebrow}</Eyebrow>
            <PageTitle as="h1" className="text-4xl sm:text-5xl">
              {labels.title}
            </PageTitle>
            <Body size="lg" className="text-muted">
              {labels.subtitle}
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
