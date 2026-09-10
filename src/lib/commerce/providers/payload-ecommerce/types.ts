export type PayloadLocalizedText =
  string | Partial<Record<"en" | "es", string | null>>;

export type PayloadDoc = {
  id: string | number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type PayloadListResponse<T> = {
  docs: T[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page?: number;
  pagingCounter?: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage?: number | null;
  nextPage?: number | null;
};

export type PayloadMedia = {
  id?: string | number;
  url?: string | null;
  alt?: string | null;
  filename?: string | null;
  width?: number | null;
  height?: number | null;
  mimeType?: string | null;
  caption?: PayloadLocalizedText | null;
  poster?: unknown;
  sizes?: Record<
    string,
    { url?: string | null; width?: number | null; height?: number | null }
  >;
};

export type PayloadCategoryDoc = PayloadDoc & {
  title?: PayloadLocalizedText | null;
  slug?: string | null;
  description?: unknown;
  image?: unknown;
  icon?: string | null;
  parent?: string | number | PayloadCategoryDoc | null;
  displayOrder?: number | null;
  isVisible?: boolean | null;
  seo?: unknown;
};

export type PayloadBrandDoc = PayloadDoc & {
  name?: string | null;
  slug?: string | null;
  description?: unknown;
  logo?: unknown;
  countryCode?: string | null;
  website?: string | null;
  isActive?: boolean | null;
};

export type PayloadTagDoc = PayloadDoc & {
  label?: PayloadLocalizedText | null;
  slug?: string | null;
  description?: unknown;
  group?: string | null;
  isVisible?: boolean | null;
};

export type PayloadProductDoc = PayloadDoc & {
  title?: PayloadLocalizedText | null;
  name?: PayloadLocalizedText | null;
  slug?: PayloadLocalizedText | null;
  handle?: string | null;
  description?: unknown;
  richText?: unknown;
  summary?: string | null;
  informationSections?: unknown;
  countryOfOrigin?: string | null;
  region?: PayloadLocalizedText | null;
  community?: PayloadLocalizedText | null;
  originStory?: unknown;
  vendor?: string | null;
  brand?: string | number | PayloadBrandDoc | null;
  productType?: string | null;
  category?: unknown;
  additionalCategories?: unknown;
  taxonomyTags?: unknown;
  tags?: unknown;
  enableVariants?: boolean | null;
  inventory?: number | null;
  media?: unknown;
  gallery?: unknown;
  images?: unknown;
  image?: unknown;
  featuredImage?: unknown;
  variants?: { docs?: PayloadVariantDoc[] } | PayloadVariantDoc[] | null;
  meta?: {
    title?: string | null;
    description?: string | null;
  } | null;
  seo?: {
    title?: string | null;
    description?: string | null;
    image?: unknown;
    noIndex?: boolean | null;
  } | null;
  _status?: "draft" | "published";
};

export type PayloadVariantDoc = PayloadDoc & {
  title?: PayloadLocalizedText | null;
  sku?: string | null;
  inventory?: number | null;
  options?: Array<
    | string
    | number
    | {
        id?: string | number;
        label?: PayloadLocalizedText | null;
        value?: string | null;
        title?: string | null;
        variantType?:
          | string
          | number
          | {
              id?: string | number;
              label?: PayloadLocalizedText | null;
              name?: string | null;
              title?: string | null;
            }
          | null;
      }
  > | null;
  product?: string | number | PayloadProductDoc | null;
};

export type PayloadCartItem = {
  id?: string | number;
  quantity?: number;
  product?: string | number | PayloadProductDoc | null;
  variant?: string | number | PayloadVariantDoc | null;
  amount?: number | null;
  currency?: string | null;
};

export type PayloadCartDoc = PayloadDoc & {
  items?: PayloadCartItem[] | null;
  secret?: string | null;
  subtotal?: number | null;
  currency?: string | null;
  status?: string | null;
  note?: string | null;
};

export type PayloadCartMutationResult = {
  success?: boolean;
  message?: string;
  cart?: PayloadCartDoc;
  secret?: string;
};
