import type { SafeRichTextHtml } from "@/types/content";
import type { IconName } from "lucide-react/dynamic.js";

export type FulfillmentMode = "local_collection" | "delivery";

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

export type CommerceMedia =
  | (CommerceImage & { kind: "image"; caption?: string | null })
  | {
      kind: "video";
      url: string;
      embedUrl?: string;
      poster: CommerceImage | null;
      altText: string | null;
      caption?: string | null;
    };

export type CategoryReference = {
  id: string;
  handle: string;
  title: string;
  slogan?: string;
  description: string;
  image: CommerceImage | null;
  icon: CategoryIcon | null;
  parent: CategoryReference | null;
};

export type CategoryIcon = IconName;

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

export type ProductOrigin = {
  countryCode: string | null;
  region: string | null;
  community: string | null;
  story: SafeRichTextHtml | null;
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
  purchaseStatus?: "available" | "unpriced" | "soldOut" | "unavailable";
  maxPurchaseQuantity?: number | null;
  netContent?: { quantity: number; unit: string } | null;
  salesUnit?: "unit" | "pack";
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
  lifecycleStatus: "active" | "discontinued";
  media?: CommerceMedia[];
  informationSections?: ProductInformationSection[];
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
  /** Public provenance only; supplier and purchasing data never cross this contract. */
  origin?: ProductOrigin;
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
    image?: CommerceImage | null;
    noIndex?: boolean;
  };
};

export type ProductInformationSection = {
  key: string;
  title: string;
  content: SafeRichTextHtml;
};

export type ProductSummary = Pick<
  Product,
  | "id"
  | "handle"
  | "title"
  | "vendor"
  | "availableForSale"
  | "lifecycleStatus"
  | "featuredImage"
  | "priceRange"
  | "tags"
  | "classification"
> & {
  quickAddMerchandiseId?: string | null;
  origin?: Pick<ProductOrigin, "countryCode" | "region" | "community">;
};

export type Collection = {
  id: string;
  handle: string;
  title: string;
  slogan?: string;
  description: string;
  descriptionHtml: string;
  image: CommerceImage | null;
  icon: CategoryIcon | null;
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
  | "slogan"
  | "description"
  | "image"
  | "icon"
  | "parent"
  | "displayOrder"
>;

export type CartLineMerchandise = {
  id: string;
  sku?: string | null;
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

export type CheckoutOrder = {
  newerReference?: string;
  transferReportedAt?: string | null;
  receivedAt?: string | null;
  experienceRating?: number | null;
  experienceComment?: string | null;
  id: string;
  publicReference: string;
  paymentExpiresAt?: string | null;
  paymentMethod: import("./checkout").PaymentMethod;
  paymentStatus:
    "pending" | "approved" | "rejected" | "cancelled" | "unverified";
  total: Money;
};

export type OrderReceiptFeedback = {
  rating: number;
  comment?: string;
};

export type CheckoutOrderOptions = {
  paymentMethod?: import("./checkout").PaymentMethod;
  paymentExpiresAt?: string | null;
};

export type CartLine = {
  issue?: "unavailable" | "priceChanged" | "quantityExceeded" | null;
  maxPurchaseQuantity?: number | null;
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
  fulfillmentMode: FulfillmentMode | null;
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
  acceptPriceChanges?: boolean;
  fulfillmentMode?: FulfillmentMode | null;
};

export type GetProductsParams = {
  first?: number;
  after?: string;
  query?: string;
  /** Collection/category handle filter (provider-specific). */
  collection?: string;
  /** Collection/category handles combined with OR (provider-specific). */
  collections?: string[];
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
