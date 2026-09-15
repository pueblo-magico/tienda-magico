import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
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
import { cn } from "@/lib/utils/cn";
import { ArrowRight } from "lucide-react";
import { directChildCategories } from "./category-hierarchy";
import { SearchForm } from "@/features/search";
import { CommunityReviewCard } from "./CommunityReviewCard";
import { ImpactFooter } from "./ImpactFooter";
import { ImpactStoryCard } from "./ImpactStoryCard";

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
  origin: string;
  characteristics: string;
  availability: string;
  availableOnly: string;
  clearAll: string;
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
    query.origins.length ||
    query.availableOnly ||
    query.tags.length,
  );
  const count = catalog.products.items.length;
  const categoryParents: CategoryReference[] = [];
  let categoryParent = catalog.selectedCollection?.parent ?? null;
  while (categoryParent) {
    categoryParents.unshift(categoryParent);
    categoryParent = categoryParent.parent;
  }
  const categoryCards = (
    catalog.selectedCollection
      ? directChildCategories(
          catalog.collections,
          catalog.selectedCollection.id,
        )
      : catalog.collections.filter((collection) => !collection.parent)
  ).slice(0, 5);
  const heroImage = catalog.selectedCollection
    ? catalog.selectedCollection.image
    : catalog.siteSettings.shopHeroImage;
  const heroSubtitle = catalog.selectedCollection
    ? catalog.selectedCollection.description
    : labels.subtitle;

  return (
    <section className="pb-12 sm:pb-24">
      <div className="relative h-72 w-full overflow-hidden">
        <header className="bg-warm absolute inset-0 flex items-center px-6 sm:px-12 lg:px-[max(3rem,calc((100vw-72rem)/2))]">
          {heroImage?.url ? (
            <>
              <Image
                src={heroImage.url}
                alt=""
                fill
                priority
                className="object-cover"
                sizes="100vw"
              />
              <div className="from-warm via-warm/95 absolute inset-y-0 left-0 w-full bg-gradient-to-r to-transparent sm:w-4/5 lg:w-3/5" />
            </>
          ) : null}
          {catalog.selectedCollection ? (
            <nav
              aria-label={labels.collections}
              className="text-muted absolute top-6 z-10 flex flex-wrap items-center gap-2 text-xs"
            >
              <Link href={buildShopHref(locale, { ...query, collection: "" })}>
                {labels.eyebrow}
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
              <span aria-hidden>/</span>
              <span aria-current="page">
                {catalog.selectedCollection.title}
              </span>
            </nav>
          ) : null}
          <div className="relative z-10 max-w-3xl space-y-3">
            <Eyebrow className="flex items-center gap-2">
              {catalog.selectedCollection?.icon ? (
                <CategoryIcon
                  name={catalog.selectedCollection.icon}
                  className="size-3"
                />
              ) : null}
              {catalog.selectedCollection?.title ?? labels.eyebrow}
            </Eyebrow>
            <PageTitle as="h1" className="max-w-3xl text-4xl sm:text-5xl">
              {catalog.selectedCollection?.slogan ||
                catalog.selectedCollection?.title ||
                labels.title}
            </PageTitle>
            {heroSubtitle ? (
              <Body size="lg" className="text-text-black max-w-2xl">
                {heroSubtitle}
              </Body>
            ) : null}
          </div>
          {!heroImage?.url ? (
            <>
              <div
                aria-hidden
                className="bg-brand/8 absolute -top-24 -right-16 h-72 w-72 rounded-full"
              />
              <div
                aria-hidden
                className="border-brand/20 absolute right-20 -bottom-28 h-52 w-52 rounded-full border"
              />
            </>
          ) : null}
        </header>
      </div>

      {categoryCards.length ? (
        <Container className="relative z-10 -mt-10">
          <nav
            aria-label={
              catalog.selectedCollection
                ? labels.subcategories
                : labels.collections
            }
          >
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {categoryCards.map((collection) => {
                const isRootCategoryCard = !catalog.selectedCollection;
                const hasRootCategoryImage = Boolean(
                  isRootCategoryCard && collection.image?.url,
                );
                const cardIcon = isRootCategoryCard ? collection.icon : null;

                return (
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
                      className={cn(
                        "border-border bg-card hover:bg-card-hover aria-[current=page]:border-brand relative flex overflow-hidden rounded-xl border p-4 transition-colors",
                        isRootCategoryCard ? "h-44" : "min-h-20",
                        isRootCategoryCard
                          ? "flex-col items-start justify-end gap-2"
                          : "items-center gap-4",
                      )}
                    >
                      {hasRootCategoryImage && collection.image?.url ? (
                        <>
                          <Image
                            src={collection.image.url}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 50vw, 20vw"
                          />
                          <span className="bg-forest/55 absolute inset-0" />
                        </>
                      ) : null}
                      <span
                        className={cn(
                          "border-border bg-background-primary z-10 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border",
                          isRootCategoryCard
                            ? "absolute top-4 left-4"
                            : "relative",
                        )}
                      >
                        {cardIcon ? (
                          <span className="text-text-secondary">
                            <CategoryIcon name={cardIcon} />
                          </span>
                        ) : collection.image?.url ? (
                          <Image
                            src={collection.image.url}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : collection.icon ? (
                          <span className="text-text-secondary">
                            <CategoryIcon name={collection.icon} />
                          </span>
                        ) : null}
                      </span>
                      <span
                        className={cn(
                          "relative z-10 min-w-0",
                          hasRootCategoryImage && "text-card",
                        )}
                      >
                        <span className="block font-serif text-base">
                          {collection.title}
                        </span>
                        {collection.description ? (
                          <span
                            className={cn(
                              "mt-1 block truncate text-xs",
                              hasRootCategoryImage
                                ? "text-card/80"
                                : "text-muted",
                            )}
                          >
                            {collection.description}
                          </span>
                        ) : null}
                      </span>
                      <ArrowRight
                        aria-hidden
                        className={cn(
                          "z-10 size-4",
                          isRootCategoryCard
                            ? "absolute right-4 bottom-4"
                            : "relative ml-auto",
                          hasRootCategoryImage && "text-card",
                        )}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </Container>
      ) : null}

      <Container className="mt-10 space-y-9">
        <div className="space-y-4">
          <SearchForm initialQuery={query.q} />
          {query.q ? (
            <div>
              <h2 className="font-serif text-2xl">
                {t("resultsFor", { query: query.q })}
              </h2>
            </div>
          ) : null}
        </div>

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
                origins={catalog.availableOrigins}
                priceBounds={catalog.priceBounds}
                query={query}
                labels={{
                  collections: labels.collections,
                  filters: labels.filters,
                  price: labels.price,
                  minPrice: labels.minPrice,
                  maxPrice: labels.maxPrice,
                  characteristics: labels.characteristics,
                  origin: labels.origin,
                  availability: labels.availability,
                  availableOnly: labels.availableOnly,
                  clearAll: labels.clearAll,
                }}
              />
            </aside>

            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-muted text-sm">{t("results", { count })}</p>
                <ShopToolbar
                  locale={locale}
                  query={query}
                  labels={{
                    sort: labels.sort,
                    sortBest: labels.sortBest,
                    sortNewest: labels.sortNewest,
                    sortTitleAsc: labels.sortTitleAsc,
                    sortTitleDesc: labels.sortTitleDesc,
                    sortPriceAsc: labels.sortPriceAsc,
                    sortPriceDesc: labels.sortPriceDesc,
                  }}
                />
              </div>

              {count === 0 ? (
                <Body className="text-muted">
                  {hasFilters ? labels.emptyFiltered : labels.empty}
                </Body>
              ) : (
                <>
                  <ProductGrid
                    locale={locale}
                    products={catalog.products.items}
                    noMediaLabel={labels.noMedia}
                  />
                </>
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
        <div className="grid gap-4 lg:grid-cols-2">
          <ImpactStoryCard locale={locale} imageUrl={heroImage?.url} />
          <CommunityReviewCard />
        </div>
        <ImpactFooter />
      </Container>
    </section>
  );
}
