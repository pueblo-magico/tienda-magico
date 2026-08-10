export type CmsMedia = {
  id: string | number;
  url?: string | null;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
  filename?: string | null;
};

export type CmsLink = {
  type?: "custom" | "internal" | null;
  label?: string | null;
  url?: string | null;
  path?: string | null;
  newTab?: boolean | null;
  appearance?: "default" | "primary" | "secondary" | "ghost" | "link" | null;
};

export type CmsSeo = {
  title?: string | null;
  description?: string | null;
  image?: CmsMedia | string | number | null;
  noIndex?: boolean | null;
};

export type CmsRichText = unknown;

type BlockBase = {
  id?: string | null;
  blockName?: string | null;
};

export type HeroBlockData = BlockBase & {
  blockType: "hero";
  eyebrow?: string | null;
  title: string;
  subtitle?: string | null;
  body?: CmsRichText;
  media?: CmsMedia | string | number | null;
  mediaPosition?: "background" | "right" | "left" | "none" | null;
  actions?: Array<{ link?: CmsLink | null }> | null;
};

export type CtaBlockData = BlockBase & {
  blockType: "cta";
  eyebrow?: string | null;
  title: string;
  description?: string | null;
  actions?: Array<{ link?: CmsLink | null }> | null;
  style?: "brand" | "sand" | "outline" | null;
};

export type InfoSectionBlockData = BlockBase & {
  blockType: "infoSection";
  eyebrow?: string | null;
  title: string;
  body?: CmsRichText;
  media?: CmsMedia | string | number | null;
  layout?: "textMedia" | "mediaText" | "centered" | null;
  link?: CmsLink | null;
};

export type GalleryBlockData = BlockBase & {
  blockType: "gallery";
  title?: string | null;
  images?: Array<{
    image: CmsMedia | string | number;
    caption?: string | null;
  }> | null;
  columns?: "2" | "3" | "4" | null;
};

export type TestimonialsBlockData = BlockBase & {
  blockType: "testimonials";
  eyebrow?: string | null;
  title?: string | null;
  selection?: "manual" | "latest" | null;
  items?: Array<CmsTestimonial | string | number> | null;
  limit?: number | null;
};

export type FaqBlockData = BlockBase & {
  blockType: "faq";
  eyebrow?: string | null;
  title?: string | null;
  selection?: "manual" | "category" | "all" | null;
  items?: Array<CmsFaq | string | number> | null;
  category?: string | null;
};

export type NewsletterBlockData = BlockBase & {
  blockType: "newsletter";
  eyebrow?: string | null;
  title: string;
  description?: string | null;
  placeholder?: string | null;
  buttonLabel?: string | null;
  successMessage?: string | null;
  formId?: string | null;
};

export type FeaturedProductsBlockData = BlockBase & {
  blockType: "featuredProducts";
  eyebrow?: string | null;
  title?: string | null;
  description?: string | null;
  selection?: "manual" | "category" | null;
  products?: Array<{ id?: string | number; slug?: string } | string | number> | null;
  category?: { id?: string | number; slug?: string } | string | number | null;
  limit?: number | null;
};

export type FeaturedCategoriesBlockData = BlockBase & {
  blockType: "featuredCategories";
  eyebrow?: string | null;
  title?: string | null;
  description?: string | null;
  selection?: "manual" | "latest" | null;
  categories?: Array<{ id?: string | number; slug?: string } | string | number> | null;
  limit?: number | null;
};

export type ImpactStatsBlockData = BlockBase & {
  blockType: "impactStats";
  eyebrow?: string | null;
  title?: string | null;
  stats?: Array<{
    value: string;
    label: string;
    description?: string | null;
  }> | null;
};

export type CmsLayoutBlock =
  | HeroBlockData
  | CtaBlockData
  | InfoSectionBlockData
  | GalleryBlockData
  | TestimonialsBlockData
  | FaqBlockData
  | NewsletterBlockData
  | FeaturedProductsBlockData
  | FeaturedCategoriesBlockData
  | ImpactStatsBlockData;

export type CmsPage = {
  id: string | number;
  title: string;
  slug: string;
  layout?: CmsLayoutBlock[] | null;
  seo?: CmsSeo | null;
  _status?: "draft" | "published" | null;
};

export type CmsTestimonial = {
  id: string | number;
  quote: string;
  name: string;
  role?: string | null;
  avatar?: CmsMedia | string | number | null;
  rating?: number | null;
};

export type CmsFaq = {
  id: string | number;
  question: string;
  answer?: CmsRichText;
  category?: string | null;
  sortOrder?: number | null;
};

export type PayloadListResponse<T> = {
  docs: T[];
  totalDocs?: number;
  hasNextPage?: boolean;
};
