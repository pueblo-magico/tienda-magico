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
  sizes?: Record<string, { url?: string | null; width?: number | null; height?: number | null }>;
};

export type PayloadProductDoc = PayloadDoc & {
  title?: string | null;
  name?: string | null;
  slug?: string | null;
  handle?: string | null;
  description?: unknown;
  richText?: unknown;
  summary?: string | null;
  vendor?: string | null;
  brand?: string | null;
  productType?: string | null;
  category?: unknown;
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
  } | null;
  _status?: "draft" | "published";
};

export type PayloadVariantDoc = PayloadDoc & {
  title?: string | null;
  sku?: string | null;
  inventory?: number | null;
  options?: Array<
    | string
    | number
    | {
        id?: string | number;
        label?: string | null;
        value?: string | null;
        title?: string | null;
        variantType?:
          | string
          | number
          | {
              id?: string | number;
              label?: string | null;
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
