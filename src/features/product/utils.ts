import type { Product, ProductVariant, SelectedOption } from "@/types/commerce";

export function getDefaultVariant(product: Product): ProductVariant | null {
  if (!product.variants.length) return null;
  return (
    product.variants.find((variant) => variant.availableForSale) ??
    product.variants[0] ??
    null
  );
}

export function findVariant(
  product: Product,
  selected: SelectedOption[],
): ProductVariant | null {
  if (!product.variants.length) return null;

  const matches = product.variants.filter(
    (variant) =>
      selected.length === variant.selectedOptions.length &&
      selected.every((sel) =>
        variant.selectedOptions.some((opt) =>
          sel.optionId && sel.valueId
            ? opt.optionId === sel.optionId && opt.valueId === sel.valueId
            : opt.name === sel.name && opt.value === sel.value,
        ),
      ),
  );

  return matches.length === 1 ? matches[0] : null;
}

/** Prefer product images; fall back to variant images. */
export function getGalleryImages(product: Product) {
  if (product.images?.length) return product.images;
  if (product.featuredImage) return [product.featuredImage];

  const fromVariants = product.variants
    .map((variant) => variant.image)
    .filter((image): image is NonNullable<typeof image> => Boolean(image?.url));

  return fromVariants;
}

export function impactItemsFromProduct(product: Product): Array<{
  value: string;
  label: string;
}> {
  const tags = product.tags ?? [];
  const items: Array<{ value: string; label: string }> = [];

  for (const tag of tags) {
    const match = /^impact\s*:\s*(.+)$/i.exec(tag);
    if (match?.[1]) {
      items.push({ value: "•", label: match[1].trim() });
    }
  }

  if (product.vendor) {
    items.push({ value: "✓", label: product.vendor });
  }
  if (product.productType) {
    items.push({ value: "✓", label: product.productType });
  }

  // unique by label
  const seen = new Set<string>();
  return items
    .filter((item) => {
      const key = item.label.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 4);
}
