import { commerce } from "@/lib/commerce";
import type { Product, ProductSummary } from "@/types/commerce";

export type ProductPageData = {
  product: Product;
  related: ProductSummary[];
};

export async function loadProductPage(
  handle: string,
  locale: string,
): Promise<ProductPageData | null> {
  if (!commerce.isConfigured()) return null;

  const product = await commerce.getProduct(handle, { locale });
  if (!product) return null;

  let related: ProductSummary[] = [];
  try {
    const listed = await commerce.getProducts({
      first: 8,
      locale,
      sortKey: "BEST_SELLING",
    });
    related = listed.items
      .filter((item) => item.id !== product.id && item.handle !== product.handle)
      .slice(0, 4);
  } catch {
    related = [];
  }

  return { product, related };
}
