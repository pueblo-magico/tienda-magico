import { cmsFetch } from "./client";
import { getCmsConfig } from "./config";
import type { CmsFaq, CmsPage, CmsTestimonial, PayloadListResponse } from "./types";

export async function getPageBySlug(
  slug: string,
  locale?: string,
): Promise<CmsPage | null> {
  const config = getCmsConfig();
  if (!config) return null;

  const data = await cmsFetch<PayloadListResponse<CmsPage>>({
    path: "/pages",
    locale,
    query: {
      "where[slug][equals]": slug,
      "where[_status][equals]": "published",
      limit: 1,
      depth: config.depth,
    },
    next: { revalidate: 60, tags: [`cms-page-${slug}`] },
  });

  return data.docs[0] ?? null;
}

export async function getHomePage(locale?: string): Promise<CmsPage | null> {
  const config = getCmsConfig();
  if (!config) return null;
  return getPageBySlug(config.homePageSlug, locale);
}

export async function getTestimonials(params?: {
  locale?: string;
  limit?: number;
  ids?: Array<string | number>;
}): Promise<CmsTestimonial[]> {
  const config = getCmsConfig();
  if (!config) return [];

  const query: Record<string, string | number | boolean> = {
    limit: params?.limit ?? 6,
    depth: 1,
    "where[_status][equals]": "published",
    sort: "-updatedAt",
  };

  if (params?.ids?.length) {
    query["where[id][in]"] = params.ids.join(",");
  }

  const data = await cmsFetch<PayloadListResponse<CmsTestimonial>>({
    path: "/testimonials",
    locale: params?.locale,
    query,
    next: { revalidate: 60, tags: ["cms-testimonials"] },
  });

  return data.docs;
}

export async function getFaqs(params?: {
  locale?: string;
  limit?: number;
  ids?: Array<string | number>;
  category?: string;
}): Promise<CmsFaq[]> {
  const config = getCmsConfig();
  if (!config) return [];

  const query: Record<string, string | number | boolean> = {
    limit: params?.limit ?? 20,
    depth: 0,
    "where[_status][equals]": "published",
    sort: "sortOrder",
  };

  if (params?.ids?.length) {
    query["where[id][in]"] = params.ids.join(",");
  }
  if (params?.category) {
    query["where[category][equals]"] = params.category;
  }

  const data = await cmsFetch<PayloadListResponse<CmsFaq>>({
    path: "/faqs",
    locale: params?.locale,
    query,
    next: { revalidate: 60, tags: ["cms-faqs"] },
  });

  return data.docs;
}
