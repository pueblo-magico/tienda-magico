import { parseFulfillmentMode } from "@/lib/commerce/local-purchase";
import {
  CommerceError,
  type Cart,
  type CartLine,
  type Collection,
  type CollectionSummary,
  type Money,
  type Product,
  type ProductSummary,
  type ProductVariant,
  type CommerceImage,
} from "@/types/commerce";

type Maybe<T> = T | null | undefined;

type ShopifyConnection<T> = {
  nodes?: Maybe<T>[];
  edges?: Array<{ node?: Maybe<T> }>;
};

function nodesFromConnection<T>(connection?: Maybe<ShopifyConnection<T>>): T[] {
  if (!connection) return [];
  if (connection.nodes) {
    return connection.nodes.filter((node): node is T => Boolean(node));
  }
  if (connection.edges) {
    return connection.edges
      .map((edge) => edge.node)
      .filter((node): node is T => Boolean(node));
  }
  return [];
}

export function mapMoney(money?: Maybe<Money>): Money {
  return {
    amount: money?.amount ?? "0.0",
    currencyCode: money?.currencyCode ?? "USD",
  };
}

export function mapImage(image?: Maybe<CommerceImage>): CommerceImage | null {
  if (!image?.url) return null;
  return {
    url: image.url,
    altText: image.altText ?? null,
    width: image.width ?? null,
    height: image.height ?? null,
  };
}

export function mapProductSummary(product: {
  id: string;
  handle: string;
  title: string;
  vendor?: string | null;
  availableForSale?: boolean | null;
  tags?: string[] | null;
  featuredImage?: Maybe<CommerceImage>;
  priceRange?: {
    minVariantPrice?: Maybe<Money>;
    maxVariantPrice?: Maybe<Money>;
  };
}): ProductSummary {
  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    vendor: product.vendor ?? "",
    availableForSale: Boolean(product.availableForSale),
    lifecycleStatus: "active",
    tags: product.tags ?? [],
    featuredImage: mapImage(product.featuredImage),
    priceRange: {
      minVariantPrice: mapMoney(product.priceRange?.minVariantPrice),
      maxVariantPrice: mapMoney(product.priceRange?.maxVariantPrice),
    },
  };
}

export function mapProductVariant(variant: {
  id: string;
  title: string;
  availableForSale?: boolean | null;
  quantityAvailable?: number | null;
  sku?: string | null;
  selectedOptions?: Array<{ name: string; value: string }> | null;
  price?: Maybe<Money>;
  compareAtPrice?: Maybe<Money>;
  image?: Maybe<CommerceImage>;
}): ProductVariant {
  return {
    id: variant.id,
    title: variant.title,
    availableForSale: Boolean(variant.availableForSale),
    quantityAvailable: variant.quantityAvailable ?? null,
    sku: variant.sku ?? null,
    selectedOptions: variant.selectedOptions ?? [],
    price: mapMoney(variant.price),
    compareAtPrice: variant.compareAtPrice
      ? mapMoney(variant.compareAtPrice)
      : null,
    image: mapImage(variant.image),
  };
}

export function mapProduct(product: {
  id: string;
  handle: string;
  title: string;
  description?: string | null;
  descriptionHtml?: string | null;
  vendor?: string | null;
  productType?: string | null;
  tags?: string[] | null;
  availableForSale?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  featuredImage?: Maybe<CommerceImage>;
  images?: ShopifyConnection<CommerceImage>;
  options?: Array<{ id: string; name: string; values: string[] }> | null;
  variants?: ShopifyConnection<Parameters<typeof mapProductVariant>[0]>;
  priceRange?: {
    minVariantPrice?: Maybe<Money>;
    maxVariantPrice?: Maybe<Money>;
  };
  seo?: {
    title?: string | null;
    description?: string | null;
  } | null;
}): Product {
  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    description: product.description ?? "",
    descriptionHtml: product.descriptionHtml ?? "",
    vendor: product.vendor ?? "",
    productType: product.productType ?? "",
    tags: product.tags ?? [],
    availableForSale: Boolean(product.availableForSale),
    lifecycleStatus: "active",
    createdAt: product.createdAt ?? "",
    updatedAt: product.updatedAt ?? "",
    featuredImage: mapImage(product.featuredImage),
    images: nodesFromConnection(product.images)
      .map((image) => mapImage(image)!)
      .filter(Boolean),
    options: (product.options ?? []).map((option) => ({
      id: option.id,
      name: option.name,
      values: option.values,
    })),
    variants: nodesFromConnection(product.variants).map(mapProductVariant),
    priceRange: {
      minVariantPrice: mapMoney(product.priceRange?.minVariantPrice),
      maxVariantPrice: mapMoney(product.priceRange?.maxVariantPrice),
    },
    seo: {
      title: product.seo?.title ?? null,
      description: product.seo?.description ?? null,
    },
  };
}

export function mapCollectionSummary(collection: {
  id: string;
  handle: string;
  title: string;
  description?: string | null;
  image?: Maybe<CommerceImage>;
}): CollectionSummary {
  return {
    id: collection.id,
    handle: collection.handle,
    title: collection.title,
    description: collection.description ?? "",
    image: mapImage(collection.image),
    icon: null,
  };
}

export function mapCollection(collection: {
  id: string;
  handle: string;
  title: string;
  description?: string | null;
  descriptionHtml?: string | null;
  image?: Maybe<CommerceImage>;
  seo?: {
    title?: string | null;
    description?: string | null;
  } | null;
  products?: ShopifyConnection<Parameters<typeof mapProductSummary>[0]>;
}): Collection {
  return {
    id: collection.id,
    handle: collection.handle,
    title: collection.title,
    description: collection.description ?? "",
    descriptionHtml: collection.descriptionHtml ?? "",
    image: mapImage(collection.image),
    icon: null,
    seo: {
      title: collection.seo?.title ?? null,
      description: collection.seo?.description ?? null,
    },
    products: nodesFromConnection(collection.products).map(mapProductSummary),
  };
}

export function mapCartLine(line: {
  id: string;
  quantity: number;
  cost?: {
    totalAmount?: Maybe<Money>;
    amountPerQuantity?: Maybe<Money>;
  } | null;
  merchandise?: {
    id: string;
    sku?: string | null;
    title: string;
    selectedOptions?: Array<{ name: string; value: string }> | null;
    price?: Maybe<Money>;
    product?: {
      id: string;
      handle: string;
      title: string;
      featuredImage?: Maybe<CommerceImage>;
    } | null;
  } | null;
}): CartLine | null {
  if (!line.merchandise?.id || !line.merchandise.product) {
    return null;
  }

  return {
    id: line.id,
    quantity: line.quantity,
    cost: {
      totalAmount: mapMoney(line.cost?.totalAmount),
      amountPerQuantity: mapMoney(line.cost?.amountPerQuantity),
    },
    merchandise: {
      id: line.merchandise.id,
      sku: line.merchandise.sku ?? null,
      title: line.merchandise.title,
      selectedOptions: line.merchandise.selectedOptions ?? [],
      price: mapMoney(line.merchandise.price),
      product: {
        id: line.merchandise.product.id,
        handle: line.merchandise.product.handle,
        title: line.merchandise.product.title,
        featuredImage: mapImage(line.merchandise.product.featuredImage),
      },
    },
  };
}

export function mapCart(cart: {
  id: string;
  checkoutUrl: string;
  totalQuantity?: number | null;
  note?: string | null;
  attributes?: Array<{ key: string; value: string }> | null;
  cost?: {
    subtotalAmount?: Maybe<Money>;
    totalAmount?: Maybe<Money>;
    totalTaxAmount?: Maybe<Money>;
  } | null;
  lines?: ShopifyConnection<Parameters<typeof mapCartLine>[0]>;
}): Cart {
  return {
    id: cart.id,
    checkoutUrl: cart.checkoutUrl,
    fulfillmentMode: (() => {
      const value = cart.attributes?.find(
        (attribute) => attribute.key === "fulfillment_mode",
      )?.value;
      return value ? parseFulfillmentMode(value) : null;
    })(),
    totalQuantity: cart.totalQuantity ?? 0,
    note: cart.note ?? null,
    cost: {
      subtotalAmount: mapMoney(cart.cost?.subtotalAmount),
      totalAmount: mapMoney(cart.cost?.totalAmount),
      totalTaxAmount: cart.cost?.totalTaxAmount
        ? mapMoney(cart.cost.totalTaxAmount)
        : null,
    },
    lines: nodesFromConnection(cart.lines)
      .map(mapCartLine)
      .filter((line): line is CartLine => Boolean(line)),
  };
}

export function assertNoUserErrors(
  userErrors:
    Array<{ message: string; field?: string[] | null }> | null | undefined,
  action: string,
) {
  if (userErrors?.length) {
    throw new CommerceError(
      `${action} failed: ${userErrors.map((error) => error.message).join(" | ")}`,
      { provider: "shopify", errors: userErrors },
    );
  }
}
