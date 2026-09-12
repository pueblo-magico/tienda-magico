import { CommerceError } from "@/types/commerce";
import type { PayloadProductDoc, PayloadVariantDoc } from "./types";

/** Database identities, never localized labels or URL slugs. */
export type PayloadMerchandise =
  | { kind: "product"; productId: string }
  | { kind: "variant"; productId: string; variantId: string };

export function merchandiseRef(
  kind: "product" | "variant",
  id: string,
): string {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw new CommerceError("Invalid merchandise identity.", {
      provider: "payload",
      status: 400,
    });
  }
  return `${kind}:${id}`;
}

type CatalogLookup = {
  findProduct: (id: string) => Promise<PayloadProductDoc | null>;
  findVariant: (id: string) => Promise<PayloadVariantDoc | null>;
};

function invalid(message: string, status = 400): never {
  throw new CommerceError(message, { provider: "payload", status });
}

/** Also accepts legacy unqualified IDs, but never guesses across collections. */
export async function resolvePayloadMerchandise(
  reference: string,
  lookup: CatalogLookup,
): Promise<PayloadMerchandise> {
  const parts = reference.trim().split(":");
  const validId = (id: string | undefined) =>
    Boolean(id && /^[a-zA-Z0-9_-]+$/.test(id));

  async function productItem(id: string): Promise<PayloadMerchandise> {
    const product = await lookup.findProduct(id);
    if (!product || String(product.id) !== id)
      invalid("Product not found.", 404);
    if (product.enableVariants) invalid("Select a variant for this product.");
    return { kind: "product", productId: id };
  }

  async function variantItem(
    id: string,
    expectedProduct?: string,
  ): Promise<PayloadMerchandise> {
    const variant = await lookup.findVariant(id);
    if (!variant || String(variant.id) !== id)
      invalid("Variant not found.", 404);
    const parent = variant.product;
    const productId = typeof parent === "object" && parent ? parent.id : parent;
    if (productId == null) invalid("Variant has no linked product.", 404);
    const parentId = String(productId);
    if (expectedProduct && expectedProduct !== parentId)
      invalid("Variant does not belong to this product.");
    const product = await lookup.findProduct(parentId);
    if (!product || String(product.id) !== parentId)
      invalid("Variant product not found.", 404);
    if (product.enableVariants === false)
      invalid("Variants are disabled for this product.");
    return { kind: "variant", productId: parentId, variantId: id };
  }

  if (parts.length === 2 && validId(parts[1])) {
    if (parts[0] === "product") return productItem(parts[1]);
    if (parts[0] === "variant") return variantItem(parts[1]);
    if (validId(parts[0])) return variantItem(parts[1], parts[0]);
  }
  if (parts.length !== 1 || !validId(parts[0]))
    invalid("Invalid merchandise reference.");

  const id = parts[0];
  const [product, variant] = await Promise.all([
    lookup.findProduct(id),
    lookup.findVariant(id),
  ]);
  if (product && variant)
    invalid(
      "Ambiguous legacy merchandise reference. Refresh the product before adding it.",
      409,
    );
  if (variant) return variantItem(id);
  if (product) return productItem(id);
  return invalid("Merchandise not found.", 404);
}
