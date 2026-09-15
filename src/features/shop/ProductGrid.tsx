import { ProductCard } from "@/components/cards/ProductCard";
import { localizePath } from "@/config/navigation";
import { formatMoney } from "@/lib/commerce/utils/format";
import type { ProductSummary } from "@/types/commerce";
import { useTranslations } from "next-intl";
import { AddToCartButton } from "@/features/cart";

type Props = {
  locale: string;
  products: ProductSummary[];
  noMediaLabel: string;
};

export function ProductGrid({ locale, products, noMediaLabel }: Props) {
  const t = useTranslations("product");
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <li key={product.id} className="h-full">
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
            action={
              product.quickAddMerchandiseId ? (
                <AddToCartButton
                  merchandiseId={product.quickAddMerchandiseId}
                />
              ) : null
            }
          />
        </li>
      ))}
    </ul>
  );
}
