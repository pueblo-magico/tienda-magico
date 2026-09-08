import type {
  Cart,
  BrandReference,
  CategoryReference,
  CartLine,
  CommerceMedia,
  Collection,
  CollectionSummary,
  CommerceImage,
  Money,
  Product,
  ProductOption,
  ProductSummary,
  ProductVariant,
  SelectedOption,
  TagReference,
} from "@/types/commerce";
import { CommerceError } from "@/types/commerce";
import { mapInformationSections } from "./information-sections";
import { richTextToHtml, richTextToPlain } from "@/lib/cms/richtext";
import { getPayloadEcommerceConfig } from "./config";
import { merchandiseRef } from "./merchandise";
import type {
  PayloadCartDoc,
  PayloadBrandDoc,
  PayloadCategoryDoc,
  PayloadMedia,
  PayloadProductDoc,
  PayloadVariantDoc,
  PayloadLocalizedText,
  PayloadTagDoc,
} from "./types";

export function encodeCartRef(cartId: string, secret?: string | null): string {
  if (!secret) return cartId;
  return `${cartId}::${secret}`;
}

export function decodeCartRef(cartRef: string): {
  cartId: string;
  secret?: string;
} {
  const separator = "::";
  const index = cartRef.indexOf(separator);
  if (index === -1) {
    return { cartId: cartRef };
  }
  return {
    cartId: cartRef.slice(0, index),
    secret: cartRef.slice(index + separator.length) || undefined,
  };
}

export function toId(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "object" && value && "id" in value) {
    return toId(value.id);
  }
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}

/**
 * Payload Postgres relationship fields reject numeric IDs sent as strings
 * (e.g. "1" fails, 1 succeeds). Keep non-numeric IDs as strings.
 */
export function toPayloadRelationId(value: unknown): string | number {
  const id = toId(value).trim();
  if (!id) return id;
  if (/^\d+$/.test(id)) {
    const asNumber = Number(id);
    if (Number.isSafeInteger(asNumber)) return asNumber;
  }
  return id;
}

/** Merge full product docs into cart lines (titles, handles, images, unit prices). */
export function enrichCartWithProducts(
  cart: Cart,
  productsById: Map<string, PayloadProductDoc>,
  locale?: string | null,
): Cart {
  if (!productsById.size) return cart;

  const config = getPayloadEcommerceConfig();
  const currency = cart.cost.subtotalAmount.currencyCode || config.currencyCode;

  const lines = cart.lines.map((line) => {
    const doc = productsById.get(line.merchandise.product.id);
    if (!doc) return line;

    const title = productTitle(doc, locale);
    const handle = productHandle(doc, locale);
    const image =
      collectImages(doc, locale)[0] ?? line.merchandise.product.featuredImage;
    const amountRaw = readAmount(doc as Record<string, unknown>, currency);
    const hasLinePrice =
      Number.parseFloat(line.cost.amountPerQuantity.amount) > 0;
    const unitMoney =
      hasLinePrice || line.merchandise.id.startsWith("variant:")
        ? line.cost.amountPerQuantity
        : mapMoney(amountRaw ?? 0, currency);
    const unitMajor = Number.parseFloat(unitMoney.amount);
    const lineMajor = unitMajor * line.quantity;

    return {
      ...line,
      cost: {
        amountPerQuantity: unitMoney,
        totalAmount: moneyFromMajor(lineMajor, currency),
      },
      merchandise: {
        ...line.merchandise,
        // Always prefer the enriched product title (localized / complete).
        title,
        price: unitMoney,
        product: {
          id: line.merchandise.product.id,
          handle,
          title,
          featuredImage: image,
        },
      },
    } satisfies CartLine;
  });

  const subtotalFromLines = lines.reduce(
    (sum, line) => sum + Number.parseFloat(line.cost.totalAmount.amount),
    0,
  );

  const preferCartSubtotal =
    Number.parseFloat(cart.cost.subtotalAmount.amount) > 0 &&
    subtotalFromLines <= 0;

  return {
    ...cart,
    lines,
    cost: preferCartSubtotal
      ? cart.cost
      : {
          subtotalAmount: moneyFromMajor(subtotalFromLines, currency),
          totalAmount: moneyFromMajor(subtotalFromLines, currency),
          totalTaxAmount: cart.cost.totalTaxAmount,
        },
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Resolve Payload localized field values (string or { en, es, ... }). */
export function resolveLocalizedText(
  value: unknown,
  preferredLocales: string[] = [],
): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";

  const record = value as Record<string, unknown>;
  for (const locale of preferredLocales) {
    const candidate = record[locale];
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  for (const candidate of Object.values(record)) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return "";
}

function absoluteMediaUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  try {
    const base = getPayloadEcommerceConfig().baseUrl;
    return new URL(url, `${base}/`).toString();
  } catch {
    return url;
  }
}

function mapProductMedia(
  value: unknown,
  locale: string,
  fallback: string,
): CommerceMedia[] {
  if (!Array.isArray(value)) return [];
  const mapped = value.flatMap(
    (entry): Array<CommerceMedia & { isPrimary?: boolean }> => {
      if (!entry || typeof entry !== "object") return [];
      const row = entry as Record<string, unknown>;
      const externalUrl =
        typeof row.externalVideoUrl === "string"
          ? youtubeEmbedUrl(row.externalVideoUrl)
          : null;
      if (externalUrl) {
        const poster =
          mapMedia(row.poster ?? row.image) ??
          youtubeThumbnail(externalUrl, locale);
        return [
          {
            kind: "video",
            url: externalUrl,
            embedUrl: externalUrl,
            poster,
            altText: poster?.altText ?? null,
            caption: (() => {
              if (typeof row.caption === "string") return row.caption;
              const captionRecord = asRecord(row.caption);
              if (!captionRecord) return null;
              return String(
                captionRecord[
                  locale === "en" || locale === "es" ? locale : "es"
                ] ??
                  captionRecord[
                    fallback === "en" || fallback === "es" ? fallback : "es"
                  ] ??
                  "",
              );
            })(),
            isPrimary: row.isPrimary === true,
          },
        ];
      }
      const raw = row.image ?? row.media ?? row.video ?? row;
      if (!raw || typeof raw !== "object") return [];
      const media = raw as PayloadMedia;
      const url =
        typeof media.url === "string" ? absoluteMediaUrl(media.url) : "";
      if (!url) return [];
      const captionValue = row.caption ?? media.caption;
      const captionRecord = asRecord(captionValue);
      const caption =
        typeof captionValue === "string"
          ? captionValue
          : captionRecord
            ? String(
                captionRecord[
                  locale === "en" || locale === "es" ? locale : "es"
                ] ??
                  captionRecord[
                    fallback === "en" || fallback === "es" ? fallback : "es"
                  ] ??
                  "",
              )
            : null;
      if (media.mimeType?.toLowerCase().startsWith("video/")) {
        return [
          {
            kind: "video",
            url,
            poster: mapMedia(media.poster),
            altText: media.alt ?? media.filename ?? null,
            caption,
            isPrimary: row.isPrimary === true,
          },
        ];
      }
      if (
        !media.mimeType ||
        media.mimeType.toLowerCase().startsWith("image/")
      ) {
        const image = mapMedia(media);
        return image
          ? [
              {
                ...image,
                kind: "image",
                caption,
                isPrimary: row.isPrimary === true,
              },
            ]
          : [];
      }
      return [];
    },
  );
  const primary = mapped.findIndex((item) => item.isPrimary);
  if (primary > 0) {
    const [item] = mapped.splice(primary, 1);
    mapped.unshift(item);
  }
  return mapped.map((item) => {
    const media = { ...item };
    delete media.isPrimary;
    return media;
  });
}

function youtubeEmbedUrl(value: string): string | null {
  try {
    const parsed = new URL(value.trim());
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const id =
      host === "youtu.be"
        ? parsed.pathname.split("/").filter(Boolean)[0]
        : (parsed.searchParams.get("v") ??
          parsed.pathname.match(/^\/shorts\/([^/]+)/)?.[1]);
    if (
      (host !== "youtube.com" && host !== "youtu.be") ||
      !id ||
      !/^[A-Za-z0-9_-]{6,20}$/.test(id)
    )
      return null;
    return `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
  } catch {
    return null;
  }
}

function youtubeThumbnail(
  embedUrl: string,
  locale: string,
): CommerceImage | null {
  const id = embedUrl.match(/\/embed\/([A-Za-z0-9_-]{6,20})/i)?.[1];
  if (!id) return null;

  return {
    url: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    altText:
      locale === "en"
        ? "YouTube video thumbnail"
        : "Miniatura del video de YouTube",
    width: 480,
    height: 360,
  };
}

function mapMedia(value: unknown): CommerceImage | null {
  if (!value) return null;
  if (typeof value === "string") {
    return {
      url: absoluteMediaUrl(value),
      altText: null,
      width: null,
      height: null,
    };
  }

  const media = value as PayloadMedia;
  const url =
    media.url ?? media.sizes?.card?.url ?? media.sizes?.thumbnail?.url;
  if (!url) return null;

  return {
    url: absoluteMediaUrl(url),
    altText: media.alt ?? media.filename ?? null,
    width: media.width ?? null,
    height: media.height ?? null,
  };
}

function collectImages(
  product: PayloadProductDoc,
  locale?: string | null,
): CommerceImage[] {
  const config = getPayloadEcommerceConfig();
  const source =
    Array.isArray(product.gallery) && product.gallery.length === 0
      ? product.media
      : (product.gallery ?? product.media);
  const entries = Array.isArray(source) ? source : source ? [source] : [];
  const galleryImages = mapProductMedia(
    entries.map((entry) =>
      typeof entry === "string" ? { url: entry } : entry,
    ),
    locale ?? config.defaultLocale,
    config.fallbackLocale,
  ).flatMap((media): CommerceImage[] =>
    media.kind === "image" ? [media] : media.poster ? [media.poster] : [],
  );
  const buckets = [product.images, product.image, product.featuredImage];
  const images: CommerceImage[] = [...galleryImages];

  for (const bucket of buckets) {
    if (!bucket) continue;
    if (Array.isArray(bucket)) {
      for (const item of bucket) {
        const mapped = mapMedia(
          item && typeof item === "object" && "image" in item
            ? (item as { image?: unknown }).image
            : item,
        );
        if (mapped) images.push(mapped);
      }
      continue;
    }
    const mapped = mapMedia(bucket);
    if (mapped) images.push(mapped);
  }

  const unique = new Map(images.map((image) => [image.url, image]));
  return [...unique.values()];
}

function mapTags(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((tag) => {
        if (typeof tag === "string") return tag;
        const record = asRecord(tag);
        if (!record) return "";
        return String(
          record.tag ??
            record.label ??
            record.value ??
            record.title ??
            record.id ??
            "",
        );
      })
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return [];
}

function relationshipDocs<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is T => Boolean(asRecord(item)));
  }
  const record = asRecord(value);
  if (!record) return [];
  if (Array.isArray(record.docs)) {
    return record.docs.filter((item): item is T => Boolean(asRecord(item)));
  }
  return [value as T];
}

function safeWebsite(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function mapCategoryReference(
  value: unknown,
  locale?: string | null,
  depth = 0,
): CategoryReference | null {
  const doc = asRecord(value) as PayloadCategoryDoc | null;
  if (!doc || doc.id == null || doc.isVisible === false) return null;
  const config = getPayloadEcommerceConfig();
  const preferred = [locale ?? config.defaultLocale, config.fallbackLocale];
  const handle = typeof doc.slug === "string" ? doc.slug : "";
  const title = resolveLocalizedText(doc.title, preferred);
  if (!handle || !title) return null;

  return {
    id: toId(doc.id),
    handle,
    title,
    description: richTextToPlain(doc.description),
    image: mapMedia(doc.image),
    parent:
      depth < 8 ? mapCategoryReference(doc.parent, locale, depth + 1) : null,
  };
}

function mapBrandReference(value: unknown): BrandReference | null {
  const doc = asRecord(value) as PayloadBrandDoc | null;
  if (
    !doc ||
    doc.id == null ||
    doc.isActive === false ||
    !doc.name ||
    !doc.slug
  )
    return null;
  return {
    id: toId(doc.id),
    handle: doc.slug,
    name: doc.name,
    description: richTextToPlain(doc.description),
    logo: mapMedia(doc.logo),
    countryCode: doc.countryCode?.toUpperCase() ?? null,
    website: safeWebsite(doc.website),
  };
}

function mapTagReference(
  value: unknown,
  locale?: string | null,
): TagReference | null {
  const doc = asRecord(value) as PayloadTagDoc | null;
  if (!doc || doc.id == null || doc.isVisible === false || !doc.slug)
    return null;
  const config = getPayloadEcommerceConfig();
  const preferred = [locale ?? config.defaultLocale, config.fallbackLocale];
  const label = resolveLocalizedText(doc.label, preferred);
  if (!label) return null;
  return {
    id: toId(doc.id),
    handle: doc.slug,
    label,
    description: richTextToPlain(doc.description),
    group: doc.group ?? null,
  };
}

function mapClassification(product: PayloadProductDoc, locale?: string | null) {
  const primaryCategory = mapCategoryReference(product.category, locale);
  const seenCategories = new Set(primaryCategory ? [primaryCategory.id] : []);
  const additionalCategories = relationshipDocs<PayloadCategoryDoc>(
    product.additionalCategories,
  ).flatMap((value) => {
    const category = mapCategoryReference(value, locale);
    if (!category || seenCategories.has(category.id)) return [];
    seenCategories.add(category.id);
    return [category];
  });
  const tags = relationshipDocs<PayloadTagDoc>(product.taxonomyTags).flatMap(
    (value) => {
      const tag = mapTagReference(value, locale);
      return tag ? [tag] : [];
    },
  );

  return {
    primaryCategory,
    additionalCategories,
    brand: mapBrandReference(product.brand),
    tags,
  };
}

function priceKey(currencyCode: string) {
  return `priceIn${currencyCode.toUpperCase()}`;
}

function readAmount(
  source: Record<string, unknown> | null | undefined,
  currencyCode: string,
): number | null {
  if (!source) return null;

  const directKeys = [
    priceKey(currencyCode),
    "price",
    "amount",
    "unitPrice",
    "basePrice",
  ];

  for (const key of directKeys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (
      typeof value === "string" &&
      value.trim() &&
      !Number.isNaN(Number(value))
    ) {
      return Number(value);
    }
  }

  // prices group style: { priceInARS: 1200, priceInARSEnabled: true }
  for (const [key, value] of Object.entries(source)) {
    if (
      key.toLowerCase().startsWith("pricein") &&
      key.toLowerCase().includes(currencyCode.toLowerCase()) &&
      typeof value === "number"
    ) {
      return value;
    }
  }

  return null;
}

export function mapMoney(
  amount: number | null | undefined,
  currencyCode?: string,
): Money {
  const config = getPayloadEcommerceConfig();
  const code = (currencyCode ?? config.currencyCode).toUpperCase();
  const raw = amount ?? 0;
  const normalized = config.amountIsCents ? raw / 100 : raw;

  return {
    amount: normalized.toFixed(2),
    currencyCode: code,
  };
}

function variantDocs(product: PayloadProductDoc): PayloadVariantDoc[] {
  if (product.enableVariants === false) return [];
  const variants = product.variants;
  if (!variants) return [];
  const docs = Array.isArray(variants) ? variants : (variants.docs ?? []);
  return docs.filter((doc) => {
    if (!doc || typeof doc !== "object" || doc.id == null) return false;
    return doc.product == null || toId(doc.product) === toId(product.id);
  });
}

function mapSelectedOptions(
  variant: PayloadVariantDoc,
  locale?: string | null,
): SelectedOption[] {
  const config = getPayloadEcommerceConfig();
  const preferred = [locale ?? config.defaultLocale, config.fallbackLocale];
  const options = variant.options ?? [];
  return options
    .map((option) => {
      if (
        option == null ||
        typeof option === "string" ||
        typeof option === "number"
      ) {
        return {
          name: "Option",
          value: String(option ?? ""),
          ...(option != null ? { valueId: String(option) } : {}),
        };
      }

      const typeRecord = asRecord(option.variantType);
      const name =
        (typeof option.variantType === "object" && option.variantType
          ? (option.variantType.label ??
            option.variantType.name ??
            option.variantType.title)
          : null) ??
        typeRecord?.label ??
        typeRecord?.name ??
        "Option";

      const value =
        option.label ?? option.value ?? option.title ?? toId(option.id);
      const optionId = toId(option.variantType);
      return {
        name: resolveLocalizedText(name, preferred) || "Option",
        value: resolveLocalizedText(value, preferred),
        ...(optionId ? { optionId } : {}),
        ...(option.id != null ? { valueId: toId(option.id) } : {}),
      };
    })
    .filter((option) => option.value);
}

function mapOptionsFromVariants(variants: ProductVariant[]): ProductOption[] {
  const map = new Map<string, ProductOption>();
  for (const variant of variants) {
    for (const option of variant.selectedOptions) {
      // Missing type population must not invent a label-derived identity.
      const id =
        option.optionId ??
        (option.valueId ? `unresolved-${option.valueId}` : null);
      if (!id) continue;
      const group = map.get(id) ?? {
        id,
        name: option.name,
        values: [],
        choices: [],
      };
      if (!group.values.includes(option.value)) group.values.push(option.value);
      if (
        option.valueId &&
        !group.choices?.some((choice) => choice.id === option.valueId)
      ) {
        group.choices?.push({ id: option.valueId, value: option.value });
      }
      map.set(id, group);
    }
  }

  return [...map.values()];
}

export function mapVariant(
  variant: PayloadVariantDoc,
  currencyCode?: string,
  locale?: string | null,
): ProductVariant {
  const config = getPayloadEcommerceConfig();
  const code = currencyCode ?? config.currencyCode;
  const inventory =
    typeof variant.inventory === "number" ? variant.inventory : null;
  const amount = readAmount(variant as Record<string, unknown>, code);
  const selectedOptions = mapSelectedOptions(variant, locale);

  return {
    id: merchandiseRef("variant", toId(variant.id)),
    // Payload's variant title is administrative; use public option labels instead.
    title:
      selectedOptions.map((option) => option.value).join(" / ") || "Default",
    availableForSale: inventory == null ? true : inventory > 0,
    quantityAvailable: null,
    sku: variant.sku ?? null,
    selectedOptions,
    price: mapMoney(amount, code),
    compareAtPrice: null,
    image: null,
  };
}

function productHandle(
  product: PayloadProductDoc,
  locale?: string | null,
): string {
  const config = getPayloadEcommerceConfig();
  return (
    resolveLocalizedText(product.slug, [
      locale ?? config.defaultLocale,
      config.fallbackLocale,
    ]) ||
    product.handle ||
    toId(product.id)
  );
}

function humanizeHandle(handle: string): string {
  return handle
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/** Prefer requested locale, then any non-empty localized title, then slug. */
export function productTitle(
  product: PayloadProductDoc,
  locale?: string | null,
): string {
  const config = getPayloadEcommerceConfig();
  const preferred = [
    locale ?? "",
    config.defaultLocale,
    config.fallbackLocale,
    "en",
    "es",
  ].filter(Boolean);

  const title =
    resolveLocalizedText(product.title, preferred) ||
    resolveLocalizedText(product.name, preferred);
  if (title) return title;

  const handle = productHandle(product);
  if (handle && handle !== String(product.id)) {
    return humanizeHandle(handle);
  }

  return "Untitled product";
}

export function mapProductSummary(
  product: PayloadProductDoc,
  locale?: string | null,
): ProductSummary {
  const config = getPayloadEcommerceConfig();
  const images = collectImages(product, locale);
  const variants = variantDocs(product).map((variant) =>
    mapVariant(variant, undefined, locale),
  );
  const amount =
    readAmount(product as Record<string, unknown>, config.currencyCode) ??
    (variants[0]
      ? Number.parseFloat(variants[0].price.amount) *
        (config.amountIsCents ? 100 : 1)
      : 0);

  // When variants exist, derive range from variant prices
  const variantAmounts = variants.map((variant) =>
    Number.parseFloat(variant.price.amount),
  );
  const minAmount =
    variantAmounts.length > 0
      ? Math.min(...variantAmounts)
      : Number.parseFloat(mapMoney(amount).amount);
  const maxAmount =
    variantAmounts.length > 0
      ? Math.max(...variantAmounts)
      : Number.parseFloat(mapMoney(amount).amount);

  const inventory =
    typeof product.inventory === "number" ? product.inventory : null;
  const availableForSale =
    variants.length > 0
      ? variants.some((variant) => variant.availableForSale)
      : product.enableVariants === true
        ? false
        : inventory == null
          ? product._status !== "draft"
          : inventory > 0;

  const classification = mapClassification(product, locale);
  return {
    id: toId(product.id),
    handle: productHandle(product, locale),
    title: productTitle(product, locale),
    vendor:
      classification.brand?.name ??
      (typeof product.vendor === "string" ? product.vendor : ""),
    availableForSale,
    tags: classification.tags.length
      ? classification.tags.map((tag) => tag.label)
      : mapTags(product.tags),
    classification,
    featuredImage: images[0] ?? null,
    priceRange: {
      minVariantPrice: {
        amount: minAmount.toFixed(2),
        currencyCode: config.currencyCode,
      },
      maxVariantPrice: {
        amount: maxAmount.toFixed(2),
        currencyCode: config.currencyCode,
      },
    },
  };
}

export function mapProduct(
  product: PayloadProductDoc,
  locale?: string | null,
): Product {
  const summary = mapProductSummary(product, locale);
  const images = collectImages(product, locale);
  const variants = variantDocs(product).map((variant) =>
    mapVariant(variant, undefined, locale),
  );
  const config = getPayloadEcommerceConfig();
  const media = mapProductMedia(
    product.gallery ?? product.media,
    locale ?? config.defaultLocale,
    config.fallbackLocale,
  );

  // Presentation-only simple item: never insert a hidden variant into Payload.
  const normalizedVariants =
    variants.length > 0 || product.enableVariants === true
      ? variants
      : [
          {
            id: merchandiseRef("product", toId(product.id)),
            title: "Default",
            availableForSale: summary.availableForSale,
            quantityAvailable: null,
            sku: null,
            selectedOptions: [],
            price: summary.priceRange.minVariantPrice,
            compareAtPrice: null,
            image: summary.featuredImage,
          } satisfies ProductVariant,
        ];

  const description =
    richTextToPlain(product.description) ||
    richTextToPlain(product.richText) ||
    "";

  return {
    ...summary,
    media,
    description,
    informationSections: mapInformationSections(
      product.informationSections,
      locale ?? config.defaultLocale,
      config.fallbackLocale,
    ),
    shortDescription: resolveLocalizedText(product.summary, [
      locale ?? config.defaultLocale,
      config.fallbackLocale,
    ]),
    descriptionContent: richTextToHtml(product.description ?? product.richText),
    descriptionHtml:
      richTextToHtml(product.description) ||
      richTextToHtml(product.richText) ||
      (description ? `<p>${escapeHtml(description)}</p>` : ""),
    productType: String(product.productType ?? ""),
    createdAt: product.createdAt ?? "",
    updatedAt: product.updatedAt ?? "",
    images:
      images.length > 0
        ? images
        : summary.featuredImage
          ? [summary.featuredImage]
          : [],
    options: mapOptionsFromVariants(normalizedVariants),
    variants: normalizedVariants,
    seo: {
      title: product.meta?.title ?? product.seo?.title ?? null,
      description:
        product.meta?.description ?? product.seo?.description ?? null,
    },
    // ensure currency consistency
    priceRange: {
      minVariantPrice: {
        amount: normalizedVariants.length
          ? Math.min(
              ...normalizedVariants.map((variant) =>
                Number.parseFloat(variant.price.amount),
              ),
            ).toFixed(2)
          : summary.priceRange.minVariantPrice.amount,
        currencyCode: config.currencyCode,
      },
      maxVariantPrice: {
        amount: normalizedVariants.length
          ? Math.max(
              ...normalizedVariants.map((variant) =>
                Number.parseFloat(variant.price.amount),
              ),
            ).toFixed(2)
          : summary.priceRange.maxVariantPrice.amount,
        currencyCode: config.currencyCode,
      },
    },
  };
}

export function mapCollectionSummary(
  doc: PayloadDocLike,
  locale?: string | null,
): CollectionSummary {
  const config = getPayloadEcommerceConfig();
  const preferred = [locale ?? config.defaultLocale, config.fallbackLocale];
  const category = doc as PayloadDocLike & PayloadCategoryDoc;
  return {
    id: toId(doc.id),
    handle:
      resolveLocalizedText(doc.slug, preferred) || doc.handle || toId(doc.id),
    title:
      resolveLocalizedText(doc.title, preferred) ||
      resolveLocalizedText(doc.name, preferred) ||
      "Untitled collection",
    description:
      richTextToPlain(doc.description) ||
      richTextToPlain(doc.richText) ||
      String(doc.summary ?? ""),
    image:
      collectImages(doc as PayloadProductDoc)[0] ?? mapMedia(doc.image) ?? null,
    parent: mapCategoryReference(category.parent, locale),
    displayOrder:
      typeof category.displayOrder === "number" ? category.displayOrder : 0,
  };
}

export function mapCollection(
  doc: PayloadDocLike,
  products: ProductSummary[] = [],
  locale?: string | null,
): Collection {
  const summary = mapCollectionSummary(doc, locale);
  return {
    ...summary,
    descriptionHtml:
      richTextToHtml(doc.description) ||
      richTextToHtml(doc.richText) ||
      (summary.description ? `<p>${escapeHtml(summary.description)}</p>` : ""),
    seo: {
      title:
        (asRecord(doc.meta)?.title as string | null | undefined) ??
        (asRecord(doc.seo)?.title as string | null | undefined) ??
        null,
      description:
        (asRecord(doc.meta)?.description as string | null | undefined) ??
        (asRecord(doc.seo)?.description as string | null | undefined) ??
        null,
    },
    products,
  };
}

type PayloadDocLike = {
  id: string | number;
  slug?: PayloadLocalizedText | null;
  handle?: string | null;
  title?: PayloadLocalizedText | null;
  name?: PayloadLocalizedText | null;
  description?: unknown;
  richText?: unknown;
  summary?: string | null;
  image?: unknown;
  media?: unknown;
  gallery?: unknown;
  images?: unknown;
  meta?: unknown;
  seo?: unknown;
  parent?: unknown;
  displayOrder?: number | null;
};

function moneyFromMajor(amount: number, currencyCode: string): Money {
  return {
    amount: amount.toFixed(2),
    currencyCode,
  };
}

export function mapCart(
  cart: PayloadCartDoc,
  options?: {
    secret?: string | null;
    checkoutBaseUrl?: string;
    locale?: string | null;
  },
): Cart {
  const config = getPayloadEcommerceConfig();
  const currency = String(cart.currency ?? config.currencyCode).toUpperCase();
  const secret = options?.secret ?? cart.secret ?? null;
  const cartRef = encodeCartRef(toId(cart.id), secret);
  const locale = options?.locale ?? null;

  const lines: CartLine[] = (cart.items ?? [])
    .map((item) => {
      const lineId = toId(item.id);
      if (!lineId) return null;

      const quantity = item.quantity ?? 1;
      const productDoc =
        item.product && typeof item.product === "object"
          ? (item.product as PayloadProductDoc)
          : null;
      const variantDoc =
        item.variant && typeof item.variant === "object"
          ? (item.variant as PayloadVariantDoc)
          : null;

      const productId = productDoc ? toId(productDoc.id) : toId(item.product);
      const variantId = variantDoc ? toId(variantDoc.id) : toId(item.variant);
      if (!productId) return null;
      const merchandiseId = variantId
        ? merchandiseRef("variant", variantId)
        : merchandiseRef("product", productId);

      const unitAmountRaw =
        typeof item.amount === "number"
          ? item.amount
          : variantDoc
            ? readAmount(variantDoc as Record<string, unknown>, currency)
            : !variantId && productDoc
              ? readAmount(productDoc as Record<string, unknown>, currency)
              : null;

      if (unitAmountRaw == null) {
        throw new CommerceError(
          "Cart item pricing is unavailable. Refresh and try again.",
          { provider: "payload", status: 409 },
        );
      }

      const unitMoney = mapMoney(unitAmountRaw ?? 0, currency);
      const unitMajor = Number.parseFloat(unitMoney.amount);
      const lineMajor = unitMajor * quantity;

      const lineTitle = productDoc ? productTitle(productDoc, locale) : "Item";
      const lineProductTitle = productDoc
        ? productTitle(productDoc, locale)
        : lineTitle;
      const lineProductHandle = productDoc
        ? productHandle(productDoc, locale)
        : productId;
      const featuredImage = productDoc
        ? (collectImages(productDoc)[0] ?? null)
        : null;

      return {
        id: lineId,
        quantity,
        cost: {
          amountPerQuantity: unitMoney,
          totalAmount: moneyFromMajor(lineMajor, currency),
        },
        merchandise: {
          id: merchandiseId,
          title: String(lineTitle),
          selectedOptions: variantDoc
            ? mapSelectedOptions(variantDoc, locale)
            : [],
          price: unitMoney,
          product: {
            id: productId,
            handle: lineProductHandle,
            title: String(lineProductTitle),
            featuredImage,
          },
        },
      } satisfies CartLine;
    })
    .filter((line): line is CartLine => Boolean(line));

  const subtotalFromLines = lines.reduce(
    (sum, line) => sum + Number.parseFloat(line.cost.totalAmount.amount),
    0,
  );

  const subtotal =
    typeof cart.subtotal === "number"
      ? mapMoney(cart.subtotal, currency)
      : moneyFromMajor(subtotalFromLines, currency);

  const totalQuantity = lines.reduce((sum, line) => sum + line.quantity, 0);
  const checkoutBase = options?.checkoutBaseUrl ?? config.checkoutBaseUrl;
  const checkoutUrl = buildCheckoutUrl(checkoutBase, cartRef);

  return {
    id: cartRef,
    checkoutUrl,
    totalQuantity,
    note: typeof cart.note === "string" ? cart.note : null,
    cost: {
      subtotalAmount: subtotal,
      totalAmount: subtotal,
      totalTaxAmount: null,
    },
    lines,
  };
}

function buildCheckoutUrl(checkoutBaseUrl: string, cartRef: string) {
  try {
    const url = new URL(checkoutBaseUrl);
    url.searchParams.set("cart", cartRef);
    return url.toString();
  } catch {
    const join = checkoutBaseUrl.includes("?") ? "&" : "?";
    return `${checkoutBaseUrl}${join}cart=${encodeURIComponent(cartRef)}`;
  }
}

export function pageInfoFromPayload(list: {
  page?: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage?: number | null;
  prevPage?: number | null;
}) {
  const page = list.page ?? 1;
  return {
    hasNextPage: Boolean(list.hasNextPage),
    hasPreviousPage: Boolean(list.hasPrevPage),
    startCursor: page > 1 ? String(page) : null,
    endCursor: list.hasNextPage ? String(list.nextPage ?? page + 1) : null,
  };
}

export function sortParam(
  sortKey?: string,
  reverse?: boolean,
): string | undefined {
  if (!sortKey) return undefined;
  const map: Record<string, string> = {
    TITLE: "title",
    PRICE: "price",
    CREATED: "createdAt",
    CREATED_AT: "createdAt",
    UPDATED_AT: "updatedAt",
    ID: "id",
    BEST_SELLING: "createdAt",
    RELEVANCE: "createdAt",
    MANUAL: "createdAt",
  };
  const field = map[sortKey] ?? "createdAt";
  return reverse ? `-${field}` : field;
}
