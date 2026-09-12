import { ProductCard } from "@/components/cards/ProductCard";
import { localizePath } from "@/config/navigation";
import { formatMoney } from "@/lib/commerce/utils/format";
import type { ProductSummary } from "@/types/commerce";
import { useTranslations } from "next-intl";

type Props = {
  locale: string;
  products: ProductSummary[];
  noMediaLabel: string;
};

export function ProductGrid({ locale, products, noMediaLabel }: Props) {
  const t = useTranslations("product");
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard
            href={localizePath(locale, `/shop/${product.handle}`)}
            title={product.title}
            price={
              product.availableForSale
                ? formatMoney(product.priceRange.minVariantPrice, locale)
                : t("productUnavailable")
            }
            imageSrc={product.featuredImage?.url}
            imageAlt={product.featuredImage?.altText || product.title}
            noMediaLabel={noMediaLabel}
            category={product.classification?.primaryCategory?.title}
          />
        </li>
      ))}
    </ul>
  );
}
