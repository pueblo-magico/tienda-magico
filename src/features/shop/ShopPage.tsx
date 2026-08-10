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
  const hasFilters = Boolean(query.q || query.collection);
  const count = catalog.products.items.length;

  return (
    <Section spacing="lg">
      <Container className="space-y-10">
        <header className="max-w-2xl space-y-3">
          <Eyebrow>{labels.eyebrow}</Eyebrow>
          <PageTitle as="h1" className="text-4xl sm:text-5xl">
            {labels.title}
          </PageTitle>
          <Body size="lg" className="text-muted">
            {labels.subtitle}
          </Body>
        </header>

        {!catalog.configured ? (
          <Body className="text-muted">{labels.notConfigured}</Body>
        ) : null}

        {catalog.error ? (
          <p className="rounded-xl border border-clay/30 bg-clay/10 px-4 py-3 text-sm">
            {labels.error}: {catalog.error}
          </p>
        ) : null}

        {catalog.configured ? (
          <div className="grid gap-10 lg:grid-cols-[14rem_1fr]">
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <ShopFilters
                locale={locale}
                collections={catalog.collections}
                query={query}
                labels={{
                  all: labels.allCollections,
                  collections: labels.collections,
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
                <p className="text-sm text-muted">
                  {t("results", { count })}
                </p>
              ) : null}

              {count === 0 ? (
                <Body className="text-muted">
                  {hasFilters ? labels.emptyFiltered : labels.empty}
                </Body>
              ) : (
                <ProductGrid locale={locale} products={catalog.products.items} />
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
