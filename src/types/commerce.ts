import type { SafeRichTextHtml } from "@/types/content";

export type Money = {
  amount: string;
  currencyCode: string;
};

export type CommerceImage = {
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
};

export type CategoryReference = {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: CommerceImage | null;
  parent: CategoryReference | null;
};

export type BrandReference = {
  id: string;
  handle: string;
  name: string;
  description: string;
  logo: CommerceImage | null;
  countryCode: string | null;
  website: string | null;
};

export type TagReference = {
  id: string;
  handle: string;
  label: string;
  description: string;
  group: string | null;
};

export type ProductClassification = {
  primaryCategory: CategoryReference | null;
  additionalCategories: CategoryReference[];
  brand: BrandReference | null;
  tags: TagReference[];
};

export type ProductOption = {
  id: string;
  name: string;
  values: string[];
  /** Stable provider value identities when supplied; labels remain presentation. */
  choices?: Array<{ id: string; value: string }>;
};

export type SelectedOption = {
  name: string;
  value: string;
  optionId?: string;
  valueId?: string;
};

export type ProductVariant = {
  /** Opaque sellable reference; may represent a simple product, not a persisted variant. */
  id: string;
  title: string;
  availableForSale: boolean;
  quantityAvailable: number | null;
  sku: string | null;
  selectedOptions: SelectedOption[];
  price: Money;
  compareAtPrice: Money | null;
  image: CommerceImage | null;
};

export type Product = {
  shortDescription?: string;
  descriptionContent?: SafeRichTextHtml;
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  vendor: string;
  productType: string;
  tags: string[];
  /** Structured, provider-independent public classification. */
  classification?: ProductClassification;
  availableForSale: boolean;
  createdAt: string;
  updatedAt: string;
  featuredImage: CommerceImage | null;
  images: CommerceImage[];
  options: ProductOption[];
  variants: ProductVariant[];
  priceRange: {
    minVariantPrice: Money;
    maxVariantPrice: Money;
  };
  seo: {
    title: string | null;
    description: string | null;
  };
};

export type ProductSummary = Pick<
  Product,
  | "id"
  | "handle"
  | "title"
  | "vendor"
  | "availableForSale"
  | "featuredImage"
  | "priceRange"
  | "tags"
  | "classification"
>;

export type Collection = {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  image: CommerceImage | null;
  parent?: CategoryReference | null;
  displayOrder?: number;
  seo: {
    title: string | null;
    description: string | null;
  };
  products: ProductSummary[];
};

export type CollectionSummary = Pick<
  Collection,
  | "id"
  | "handle"
  | "title"
  | "description"
  | "image"
  | "parent"
  | "displayOrder"
>;

export type CartLineMerchandise = {
  id: string;
  title: string;
  selectedOptions: SelectedOption[];
  product: {
    id: string;
    handle: string;
    title: string;
    featuredImage: CommerceImage | null;
  };
  price: Money;
};

export type CartLine = {
  id: string;
  quantity: number;
  cost: {
    totalAmount: Money;
    amountPerQuantity: Money;
  };
  merchandise: CartLineMerchandise;
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  note: string | null;
  cost: {
    subtotalAmount: Money;
    totalAmount: Money;
    totalTaxAmount: Money | null;
  };
  lines: CartLine[];
};

export type CartLineInput = {
  merchandiseId: string;
  quantity: number;
};

export type CartLineUpdateInput = {
  id: string;
  quantity: number;
};

/** Optional cart request context (locale for localized product titles/images). */
export type CartParams = {
  locale?: string | null;
};

export type GetProductsParams = {
  first?: number;
  after?: string;
  query?: string;
  /** Collection/category handle filter (provider-specific). */
  collection?: string;
  /** Preferred content locale (e.g. en, es). Provider-specific. */
  locale?: string;
  sortKey?:
    | "TITLE"
    | "PRICE"
    | "BEST_SELLING"
    | "CREATED"
    | "CREATED_AT"
    | "ID"
    | "MANUAL"
    | "RELEVANCE"
    | "UPDATED_AT";
  reverse?: boolean;
};

export type GetProductParams = {
  /** Preferred content locale (e.g. en, es). Provider-specific. */
  locale?: string;
};

export type GetCollectionsParams = {
  first?: number;
  after?: string;
  /** Preferred content locale (e.g. en, es). Provider-specific. */
  locale?: string;
};

export type GetCollectionParams = {
  productsFirst?: number;
  /** Preferred content locale (e.g. en, es). Provider-specific. */
  locale?: string;
};

export type Paginated<T> = {
  items: T[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
};

export type CommerceProviderName = "shopify" | "payload";

export class CommerceError extends Error {
  readonly status?: number;
  readonly errors?: unknown;
  readonly provider?: string;

  constructor(
    message: string,
    options?: { status?: number; errors?: unknown; provider?: string },
  ) {
    super(message);
    this.name = "CommerceError";
    this.status = options?.status;
    this.errors = options?.errors;
    this.provider = options?.provider;
  }
}

export class CommerceConfigError extends CommerceError {
  constructor(
    message = "Commerce provider is not configured.",
    provider?: string,
  ) {
    super(message, { provider });
    this.name = "CommerceConfigError";
  }
}
