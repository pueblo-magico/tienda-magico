import assert from "node:assert/strict";
import { afterEach, beforeEach, test, mock } from "node:test";
import { CommerceConfigError, CommerceError } from "@/types/commerce";
import {
  mapProduct,
  mapProductSummary,
  mapCart,
  mapCollectionSummary,
  enrichCartWithProducts,
} from "@/lib/commerce/providers/payload-ecommerce/mappers";
import {
  resolveMerchandise,
  addCartLines,
  getCart,
  updateCartLines,
  removeCartLines,
} from "@/lib/commerce/providers/payload-ecommerce/cart";
import {
  getProduct,
  getProducts,
} from "@/lib/commerce/providers/payload-ecommerce/products";
import {
  getCollection,
  getCollections,
} from "@/lib/commerce/providers/payload-ecommerce/collections";
import { richTextToHtml, richTextToPlain } from "@/lib/cms/richtext";
import { preventCategoryCycles } from "../apps/cms/src/collections/categoryHierarchy.ts";
import { normalizeProductCategories } from "../apps/cms/src/collections/productClassificationHooks.ts";
import {
  buildCategoryTree,
  directChildCategories,
} from "@/features/shop/category-hierarchy";

test("saved cart absence is recoverable but backend failures are not", async () => {
  transport({});
  assert.equal(await getCart("999::test-secret"), null);
  mock.restoreAll();
  transport({ "GET /api/carts/999": new Error("offline") });
  await assert.rejects(getCart("999::test-secret"));
});
import { mapProductVariant as mapShopifyVariant } from "@/lib/commerce/providers/shopify/mappers";
import { findVariant } from "@/features/product/utils";

test("storefront resolves stable IDs despite duplicate or translated labels", () => {
  const product = mapProduct({
    ...parent,
    variants: [
      variant,
      { ...variant, id: 2, options: [option("es", "100 g", 11)] },
    ],
  });
  assert.equal(
    findVariant(product, [
      { optionId: "5", valueId: "11", name: "Renamed", value: "Translated" },
    ])?.id,
    "variant:2",
  );
  assert.equal(
    findVariant(product, [{ name: "Tamaño", value: "100 g" }]),
    null,
  );
  assert.equal(
    findVariant(product, [
      { optionId: "5", valueId: "missing", name: "Tamaño", value: "100 g" },
    ]),
    null,
  );
  assert.equal(findVariant(product, []), null);
  assert.equal(findVariant(mapProduct(simple), [])?.id, "product:1");
});

test("invalid combinations cannot fall back to another variant; label-only providers remain supported", () => {
  const product = {
    variants: [
      {
        id: "a",
        availableForSale: true,
        selectedOptions: [
          { name: "Size", value: "Small" },
          { name: "Color", value: "Red" },
        ],
      },
      {
        id: "b",
        availableForSale: true,
        selectedOptions: [
          { name: "Size", value: "Large" },
          { name: "Color", value: "Blue" },
        ],
      },
    ],
  };
  assert.equal(
    findVariant(product, [
      { name: "Size", value: "Small" },
      { name: "Color", value: "Blue" },
    ]),
    null,
  );
  assert.equal(
    findVariant(product, product.variants[1].selectedOptions)?.id,
    "b",
  );
});

test("partial cart population never leaks private titles or substitutes parent pricing", () => {
  const cart = mapCart({
    id: 1,
    items: [
      {
        id: 1,
        product: 2,
        variant: { ...variant, title: "PRIVATE_ADMIN_TITLE" },
        quantity: 1,
      },
    ],
  });
  assert.ok(!JSON.stringify(cart).includes("PRIVATE_ADMIN_TITLE"));
  assert.throws(
    () =>
      mapCart({
        id: 1,
        items: [{ id: 1, product: parent, variant: 1, quantity: 1 }],
      }),
    (error) => error.status === 409,
  );
});

const envKeys = [
  "PAYLOAD_ECOMMERCE_URL",
  "PAYLOAD_ECOMMERCE_CURRENCY",
  "PAYLOAD_ECOMMERCE_AMOUNT_IS_CENTS",
  "PAYLOAD_ECOMMERCE_DEFAULT_LOCALE",
  "PAYLOAD_ECOMMERCE_FALLBACK_LOCALE",
  "PAYLOAD_ECOMMERCE_API_KEY",
];
let savedEnv;
beforeEach(() => {
  savedEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  process.env.PAYLOAD_ECOMMERCE_URL = "http://catalog.test";
  process.env.PAYLOAD_ECOMMERCE_CURRENCY = "ARS";
  process.env.PAYLOAD_ECOMMERCE_AMOUNT_IS_CENTS = "true";
  process.env.PAYLOAD_ECOMMERCE_DEFAULT_LOCALE = "es";
  process.env.PAYLOAD_ECOMMERCE_FALLBACK_LOCALE = "es";
  delete process.env.PAYLOAD_ECOMMERCE_API_KEY;
});
afterEach(() => {
  mock.restoreAll();
  for (const [key, value] of Object.entries(savedEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

const simple = {
  id: 1,
  title: { es: "Taza", en: "Mug" },
  slug: "taza",
  enableVariants: false,
  priceInARS: 250000,
  inventory: 7,
  _status: "published",
};

test("rich text escapes HTML strings and preserves supported Lexical formatting", () => {
  assert.equal(
    richTextToHtml('<img src=x onerror="alert(1)">'),
    "<p>&lt;img src=x onerror=&quot;alert(1)&quot;&gt;</p>",
  );
  const body = {
    root: {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [
            { type: "text", text: "Cacao " },
            { type: "text", text: "orgánico", format: 1 },
          ],
        },
        {
          type: "paragraph",
          children: [{ type: "text", text: "From the mountains" }],
        },
      ],
    },
  };
  assert.equal(richTextToPlain(body), "Cacao orgánico\nFrom the mountains");
  assert.equal(
    richTextToHtml(body),
    "<p>Cacao <strong>orgánico</strong></p><p>From the mountains</p>",
  );
  assert.equal(
    mapProduct({ ...simple, description: body }).descriptionHtml,
    richTextToHtml(body),
  );
});

test("rich-text links reject executable and browser-normalized URLs", () => {
  const link = (url) => ({
    type: "link",
    fields: { url },
    children: [{ type: "text", text: "Read more" }],
  });
  for (const url of [
    "javascript:alert(1)",
    "java\nscript:alert(1)",
    "data:text/html,<script>",
    "//evil.test",
    "/\\evil.test",
    "vbscript:msgbox(1)",
  ]) {
    assert.equal(richTextToHtml(link(url)), "Read more", url);
  }
  for (const url of [
    "https://example.test/story",
    "/es/shop",
    "#ingredients",
    "mailto:hello@example.test",
    "tel:+54123456789",
  ]) {
    assert.match(richTextToHtml(link(url)), /^<a href=/, url);
  }
});

test("el resumen y la descripción enriquecida mantienen fuentes separadas", () => {
  const body = {
    root: {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [{ type: "text", text: "Hecho a mano", format: 1 }],
        },
      ],
    },
  };
  const mapped = mapProduct({
    ...simple,
    summary: "Para tus ceremonias.",
    description: body,
  });
  assert.equal(mapped.shortDescription, "Para tus ceremonias.");
  assert.equal(
    mapProduct({ ...simple, summary: "Solo resumen" }).description,
    "",
  );
  assert.equal(
    mapped.descriptionContent,
    "<p><strong>Hecho a mano</strong></p>",
  );
  assert.equal(
    mapProduct({ ...simple, description: body }).shortDescription,
    "",
  );
  assert.equal(
    mapProduct({ ...simple, description: null }).descriptionContent,
    "",
  );
  assert.equal(
    mapProduct({ ...simple, description: "<script>alert(1)</script>" })
      .descriptionContent,
    "<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>",
  );
});

test("las secciones de información conservan orden, claves y fallback sin exponer filas vacías", () => {
  const product = mapProduct(
    {
      ...simple,
      informationSections: [
        {
          key: "ingredients",
          title: { es: "Ingredientes", en: "Ingredients" },
          body: {
            es: {
              root: {
                type: "root",
                children: [
                  {
                    type: "paragraph",
                    children: [{ type: "text", text: "Cacao" }],
                  },
                ],
              },
            },
            en: null,
          },
          isVisible: true,
        },
        {
          key: "hidden",
          title: { es: "Oculto" },
          body: { es: "No mostrar" },
          isVisible: false,
        },
        {
          key: "empty",
          title: { es: "Vacío" },
          body: { es: "" },
          isVisible: true,
        },
        {
          key: "custom",
          title: { es: "Ritual" },
          body: { es: "Usalo con intención." },
          isVisible: true,
        },
      ],
    },
    "en",
  );
  assert.deepEqual(
    product.informationSections?.map((section) => section.key),
    ["ingredients", "custom"],
  );
  assert.equal(product.informationSections?.[0]?.title, "Ingredients");
  assert.equal(product.informationSections?.[0]?.content, "<p>Cacao</p>");
  assert.equal(product.informationSections?.[1]?.title, "Ritual");
});

test("el producto proyecta origen público localizado y SEO sin datos internos", () => {
  const story = {
    es: {
      root: {
        type: "root",
        children: [
          {
            type: "paragraph",
            children: [{ type: "text", text: "Cultivado por la comunidad." }],
          },
        ],
      },
    },
    en: null,
  };
  const product = mapProduct(
    {
      ...simple,
      countryOfOrigin: "AR",
      region: { es: "Sierras de Córdoba", en: "Córdoba Hills" },
      community: { es: "Comunidad serrana", en: null },
      originStory: story,
      cost: 1234,
      supplierInfo: "privado",
      seo: {
        title: "Ritual de cacao",
        description: "Cacao ceremonial de origen consciente.",
        image: { url: "/media/cacao-seo.jpg", alt: "Cacao" },
        noIndex: true,
      },
    },
    "en",
  );

  assert.deepEqual(product.origin, {
    countryCode: "AR",
    region: "Córdoba Hills",
    community: "Comunidad serrana",
    story: "<p>Cultivado por la comunidad.</p>",
  });
  assert.equal(product.seo.title, "Ritual de cacao");
  assert.equal(
    product.seo.image?.url,
    "http://catalog.test/media/cacao-seo.jpg",
  );
  assert.equal(product.seo.noIndex, true);
  assert.equal("cost" in product, false);
  assert.equal("supplierInfo" in product, false);
});

test("la galería proyecta imágenes y videos públicos en orden, con poster y pie localizado", () => {
  const product = mapProduct(
    {
      ...simple,
      gallery: [
        {
          image: {
            url: "/media/cacao.jpg",
            mimeType: "image/jpeg",
            alt: "Cacao",
          },
          isPrimary: true,
        },
        {
          image: {
            url: "/media/ritual.mp4",
            mimeType: "video/mp4",
            alt: "Ritual",
            poster: {
              url: "/media/poster.jpg",
              mimeType: "image/jpeg",
              alt: "Poster",
            },
            caption: { es: "Ritual" },
          },
        },
      ],
    },
    "es",
  );
  assert.deepEqual(
    product.media?.map((item) => item.kind),
    ["image", "video"],
  );
  assert.equal(product.media?.[1]?.kind, "video");
  assert.equal(product.media?.[1]?.caption, "Ritual");
  assert.equal(
    product.media?.[1]?.poster?.url,
    "http://catalog.test/media/poster.jpg",
  );
});

test("la ficha y las tarjetas comparten la imagen principal sin usar archivos de video como imágenes", () => {
  const doc = {
    ...simple,
    gallery: [
      { image: { url: "/media/video.mp4", mimeType: "video/mp4" } },
      { image: { url: "/media/secondary.jpg", mimeType: "image/jpeg" } },
      {
        image: { url: "/media/primary.jpg", mimeType: "image/jpeg" },
        isPrimary: true,
      },
    ],
  };
  for (const locale of ["es", "en"]) {
    const detail = mapProduct(doc, locale);
    assert.equal(
      detail.featuredImage.url,
      "http://catalog.test/media/primary.jpg",
    );
    assert.equal(
      mapProductSummary(doc, locale).featuredImage.url,
      detail.media[0].url,
    );
    assert.deepEqual(
      detail.images.map((image) => image.url),
      [
        "http://catalog.test/media/primary.jpg",
        "http://catalog.test/media/secondary.jpg",
      ],
    );
  }
});

test("un video principal aporta su miniatura a las tarjetas y conserva el reproductor en la ficha", () => {
  const doc = {
    ...simple,
    gallery: [
      { externalVideoUrl: "https://youtu.be/abc123_XY", isPrimary: true },
    ],
  };
  assert.equal(mapProduct(doc, "es").media[0].kind, "video");
  assert.equal(
    mapProductSummary(doc, "en").featuredImage.url,
    "https://i.ytimg.com/vi/abc123_XY/hqdefault.jpg",
  );
});

test("una galería vacía conserva la imagen del campo multimedia heredado", () => {
  const product = mapProductSummary(
    {
      ...simple,
      gallery: [],
      media: [{ url: "/media/legacy.jpg", mimeType: "image/jpeg" }],
    },
    "es",
  );
  assert.equal(
    product.featuredImage.url,
    "http://catalog.test/media/legacy.jpg",
  );
});

test("la galería convierte solo URLs permitidas de YouTube en embeds privacy-enhanced", () => {
  const product = mapProduct(
    {
      ...simple,
      gallery: [
        {
          externalVideoUrl: "https://www.youtube.com/watch?v=abc123_XY",
          isPrimary: true,
        },
        { externalVideoUrl: "https://youtu.be/abc123_XY" },
        { externalVideoUrl: "https://evil.example/video.mp4" },
      ],
    },
    "es",
  );
  assert.equal(product.media?.length, 2);
  assert.equal(
    product.media?.[0]?.embedUrl,
    "https://www.youtube-nocookie.com/embed/abc123_XY?rel=0",
  );
  assert.equal(
    product.media?.[0]?.poster?.url,
    "https://i.ytimg.com/vi/abc123_XY/hqdefault.jpg",
  );
  assert.equal(
    product.media?.[0]?.poster?.altText,
    "Miniatura del video de YouTube",
  );
});

test("public catalog excludes drafts even when an authenticated backend returns them", async () => {
  process.env.PAYLOAD_ECOMMERCE_API_KEY = "test-only-key";
  const calls = transport({
    "GET /api/products": {
      docs: [simple, { ...simple, id: 9, _status: "draft" }],
      hasNextPage: false,
    },
  });
  assert.deepEqual(
    (await getProducts({ locale: "en" })).items.map((p) => p.id),
    ["1"],
  );
  assert.equal(
    calls[0].url.searchParams.get("where[_status][equals]"),
    "published",
  );
});

test("product slug and ID lookups never return drafts or records without publication status", async () => {
  for (const status of ["draft", undefined]) {
    mock.restoreAll();
    transport({
      "GET /api/products": { docs: [{ ...simple, _status: status }] },
    });
    assert.equal(await getProduct("taza"), null);
    mock.restoreAll();
    transport({
      "GET /api/products": { docs: [] },
      "GET /api/products/1": { ...simple, _status: status },
    });
    assert.equal(await getProduct("1"), null);
  }
});

test("product ID lookup preserves operational errors instead of claiming missing content", async () => {
  transport({
    "GET /api/products": { docs: [] },
    "GET /api/products/1": new Error("offline"),
  });
  await assert.rejects(getProduct("1"));
});

test("missing product slugs do not become invalid numeric-ID requests", async () => {
  const calls = transport({ "GET /api/products": { docs: [] } });
  assert.equal(await getProduct("missing-product"), null);
  assert.equal(calls.length, 1);
});

test("category-populated product references exclude drafts", async () => {
  transport({
    "GET /api/categories": {
      docs: [
        {
          id: 2,
          slug: "ritual",
          title: "Ritual",
          isVisible: true,
          products: [simple, { ...simple, id: 3, _status: "draft" }],
        },
      ],
    },
  });
  assert.deepEqual(
    (await getCollection("ritual")).products.map((p) => p.id),
    ["1"],
  );
});
const parent = {
  id: 2,
  title: "Cacao",
  slug: "cacao",
  enableVariants: true,
  inventory: 99,
  priceInARS: 999999,
  _status: "published",
};
const option = (locale, label, id = 10) => ({
  id,
  label,
  variantType: { id: 5, label: locale === "en" ? "Size" : "Tamaño" },
});
const variant = {
  id: 1,
  product: 2,
  priceInARS: 125050,
  inventory: 3,
  options: [option("es", "100 g")],
};

function transport(documents) {
  const calls = [];
  mock.method(globalThis, "fetch", async (input, init) => {
    const url = new URL(input);
    calls.push({ url, init });
    const key = `${init?.method ?? "GET"} ${url.pathname}`;
    const entry = documents[key];
    const doc = Array.isArray(entry)
      ? entry.length > 1
        ? entry.shift()
        : entry[0]
      : entry;
    if (doc instanceof Error) throw doc;
    return new Response(JSON.stringify(doc ?? { message: "Not found" }), {
      status: doc ? 200 : 404,
    });
  });
  return calls;
}

test("simple item is a presentation variant with namespaced identity and product-owned ARS price", () => {
  const product = mapProduct(simple, "en");
  assert.equal(product.id, "1");
  assert.equal(product.variants[0].id, "product:1");
  assert.equal(product.variants[0].price.amount, "2500.00");
  assert.equal(product.variants[0].price.currencyCode, "ARS");
  assert.deepEqual(product.options, []);
  assert.equal(product.variants[0].quantityAvailable, null);
});

test("multi-variant data owns its price and stable identities, not parent price/inventory", () => {
  const product = mapProduct({
    ...parent,
    variants: {
      docs: [
        variant,
        {
          ...variant,
          id: 2,
          priceInARS: 400000,
          options: [option("es", "500 g", 11)],
        },
      ],
    },
  });
  assert.deepEqual(
    product.variants.map((v) => v.id),
    ["variant:1", "variant:2"],
  );
  assert.equal(product.priceRange.minVariantPrice.amount, "1250.50");
  assert.equal(product.priceRange.maxVariantPrice.amount, "4000.00");
  assert.equal(product.options[0].id, "5");
  assert.deepEqual(product.options[0].choices, [
    { id: "10", value: "100 g" },
    { id: "11", value: "500 g" },
  ]);
});

test("disabled variants ignore stale joined rows; missing enabled variants never synthesize a simple item", () => {
  assert.equal(
    mapProduct({ ...simple, variants: [variant] }).variants[0].id,
    "product:1",
  );
  const product = mapProduct(parent);
  assert.deepEqual(product.variants, []);
  assert.equal(product.availableForSale, false);
  assert.doesNotMatch(JSON.stringify(product), /Infinity|NaN/);
  assert.deepEqual(
    mapProduct({ ...parent, variants: [{ ...variant, product: 999 }] })
      .variants,
    [],
  );
});

test("localized names change while shared slugs and stable identities do not", () => {
  const spanish = mapProduct(simple, "es"),
    english = mapProduct(simple, "en");
  assert.equal(spanish.handle, "taza");
  assert.equal(english.handle, "taza");
  assert.equal(spanish.id, english.id);
  assert.equal(spanish.variants[0].id, english.variants[0].id);
  const a = mapProduct({ ...parent, variants: [variant] }, "es");
  const b = mapProduct(
    {
      ...parent,
      variants: [{ ...variant, options: [option("en", "100 grams")] }],
    },
    "en",
  );
  assert.equal(a.options[0].id, b.options[0].id);
  assert.equal(a.options[0].choices[0].id, b.options[0].choices[0].id);
  assert.notEqual(a.options[0].name, b.options[0].name);
});

test("structured classification localizes labels while preserving stable identities", () => {
  const classified = {
    ...simple,
    category: {
      id: 10,
      slug: "rituales",
      title: { es: "Rituales", en: "Rituals" },
      isVisible: true,
      parent: {
        id: 9,
        slug: "bienestar",
        title: { es: "Bienestar", en: "Wellness" },
        isVisible: true,
      },
    },
    additionalCategories: [
      {
        id: 10,
        slug: "rituales",
        title: { es: "Rituales", en: "Rituals" },
        isVisible: true,
      },
      {
        id: 11,
        slug: "montana",
        title: { es: "Montaña", en: "Mountain" },
        isVisible: true,
      },
    ],
    brand: {
      id: 20,
      slug: "pueblo-magico",
      name: "Pueblo Mágico",
      isActive: true,
      website: "javascript:alert(1)",
    },
    taxonomyTags: [
      {
        id: 30,
        slug: "regenerativo",
        label: { es: "Regenerativo", en: "Regenerative" },
        isVisible: true,
      },
      {
        id: 31,
        slug: "privado",
        label: "Private",
        isVisible: false,
      },
    ],
  };
  const spanish = mapProduct(classified, "es");
  const english = mapProduct(classified, "en");

  assert.equal(spanish.classification.primaryCategory.handle, "rituales");
  assert.equal(english.classification.primaryCategory.title, "Rituals");
  assert.equal(english.classification.primaryCategory.parent.title, "Wellness");
  assert.deepEqual(
    english.classification.additionalCategories.map((item) => item.id),
    ["11"],
  );
  assert.deepEqual(english.tags, ["Regenerative"]);
  assert.equal(english.classification.tags[0].id, "30");
  assert.equal(english.classification.brand.website, null);
});

test("category browsing includes primary and additional membership and requests only visible ordered categories", async () => {
  const calls = transport({
    "GET /api/categories": {
      docs: [{ id: 10, slug: "rituales", title: "Rituals" }],
      hasNextPage: false,
      hasPrevPage: false,
    },
    "GET /api/products": {
      docs: [],
      hasNextPage: false,
      hasPrevPage: false,
    },
  });

  await Promise.all([
    getProducts({ collection: "rituales", locale: "en" }),
    getCollections({ locale: "en" }),
  ]);

  const categoryListCall = calls.find(
    (call) =>
      call.url.pathname === "/api/categories" &&
      call.url.searchParams.get("sort") === "displayOrder",
  );
  assert.equal(
    categoryListCall.url.searchParams.get("where[isVisible][equals]"),
    "true",
  );
  const productCall = calls.find(
    (call) => call.url.pathname === "/api/products",
  );
  assert.equal(
    productCall.url.searchParams.get(
      "where[and][0][or][2][additionalCategories][contains]",
    ),
    "10",
  );
});

test("CMS category hierarchy rejects self-parenting and descendant cycles", async () => {
  const req = {
    payload: {
      findByID: async ({ id }) =>
        ({
          2: { id: 2, parent: 3 },
          3: { id: 3, parent: 1 },
        })[id],
    },
  };
  await assert.rejects(
    preventCategoryCycles({ data: { parent: 1 }, originalDoc: { id: 1 }, req }),
    /own parent/,
  );
  await assert.rejects(
    preventCategoryCycles({ data: { parent: 2 }, originalDoc: { id: 1 }, req }),
    /category cycle/,
  );
});

test("CMS product classification removes primary and duplicate additional categories", () => {
  const data = normalizeProductCategories({
    data: {
      category: 1,
      additionalCategories: [1, { id: 2 }, 2, 3],
    },
  });
  assert.deepEqual(data.additionalCategories, [{ id: 2 }, 3]);
});

test("category navigation nests children and exposes direct child cards in configured order", () => {
  const parent = {
    id: "1",
    handle: "rituales",
    title: "Rituals",
    description: "",
    image: null,
    parent: null,
    displayOrder: 10,
  };
  const categories = [
    {
      ...parent,
      id: "3",
      handle: "otro",
      title: "Other",
      displayOrder: 20,
    },
    {
      ...parent,
      id: "2",
      handle: "descanso",
      title: "Rest",
      parent,
      displayOrder: 2,
    },
    parent,
  ];

  const tree = buildCategoryTree(categories);
  assert.deepEqual(
    tree.map((node) => node.category.id),
    ["1", "3"],
  );
  assert.deepEqual(
    tree[0].children.map((node) => node.category.id),
    ["2"],
  );
  assert.deepEqual(
    directChildCategories(categories, "1").map((category) => category.id),
    ["2"],
  );
});

test("missing translation falls back to Spanish; shared legacy strings remain compatible", () => {
  assert.equal(
    mapProduct({ ...simple, title: { es: "Taza", en: "" } }, "en").title,
    "Taza",
  );
  assert.equal(
    mapProduct({ ...simple, slug: "taza-antigua" }, "en").handle,
    "taza-antigua",
  );
  const category = mapCollectionSummary(
    {
      id: 5,
      title: { en: "Rituals", es: "Rituales" },
      slug: { en: "rituals", es: "rituales" },
    },
    "en",
  );
  assert.equal(category.handle, "rituals");
  assert.equal(category.id, "5");
});

test("public projections do not spread private fields or administrative variant titles", () => {
  const sensitive = {
    cost: { amount: 100, currency: "BRL" },
    supplier: "PRIVATE_SUPPLIER",
    notes: "PRIVATE_NOTES",
  };
  const doc = {
    ...parent,
    ...sensitive,
    variants: [{ ...variant, ...sensitive, title: "PRIVATE_ADMIN_TITLE" }],
  };
  for (const mapped of [
    mapProduct(doc),
    mapProductSummary(doc),
    mapCart({
      id: 8,
      items: [{ id: 1, product: doc, variant: doc.variants[0], quantity: 1 }],
    }),
  ]) {
    const serialized = JSON.stringify(mapped);
    assert.doesNotMatch(serialized, /PRIVATE_|"supplier"|"notes"|"inventory"/);
  }
});

test("namespaced refs disambiguate equal numeric IDs and retain numeric Payload relations", async () => {
  transport({
    "GET /api/products/1": simple,
    "GET /api/products/2": parent,
    "GET /api/variants/1": variant,
  });
  assert.deepEqual(await resolveMerchandise("product:1"), {
    kind: "product",
    productId: "1",
  });
  assert.deepEqual(await resolveMerchandise("variant:1"), {
    kind: "variant",
    productId: "2",
    variantId: "1",
  });
  await assert.rejects(
    resolveMerchandise("1"),
    (error) => error.status === 409,
  );
});

test("unambiguous legacy refs and legacy pairs still resolve", async () => {
  transport({
    "GET /api/products/9": { ...simple, id: 9 },
    "GET /api/products/2": parent,
    "GET /api/variants/1": variant,
  });
  assert.equal((await resolveMerchandise("9")).productId, "9");
  assert.equal((await resolveMerchandise("1")).variantId, "1");
  assert.equal((await resolveMerchandise("2:1")).variantId, "1");
});

test("malformed references, missing relationships and mismatched pairs fail before mutation", async () => {
  transport({
    "GET /api/products/2": parent,
    "GET /api/variants/1": variant,
    "GET /api/variants/3": { ...variant, id: 3, product: null },
  });
  for (const ref of [
    "",
    "product:",
    "variant:",
    "2:1:3",
    "product:../1",
    "9:1",
    "product:2",
    "variant:3",
    "variant:99",
  ]) {
    await assert.rejects(resolveMerchandise(ref), CommerceError);
  }
});

test("transport failures are not mistaken for absent products", async () => {
  transport({ "GET /api/products/1": new Error("offline") });
  await assert.rejects(resolveMerchandise("product:1"), /Failed to reach/);
});

test("saved carts re-emit namespaced references while keeping cart secret and line IDs", () => {
  const cart = mapCart(
    {
      id: 8,
      items: [
        { id: "line-old", product: 2, variant: 1, amount: 125050, quantity: 2 },
      ],
    },
    { secret: "fixture-secret" },
  );
  assert.equal(cart.id, "8::fixture-secret");
  assert.equal(cart.lines[0].id, "line-old");
  assert.equal(cart.lines[0].merchandise.id, "variant:1");
  assert.equal(cart.lines[0].cost.totalAmount.amount, "2501.00");
  const enriched = enrichCartWithProducts(cart, new Map([["2", parent]]), "en");
  assert.equal(enriched.lines[0].merchandise.id, "variant:1");
  assert.equal(enriched.lines[0].cost.amountPerQuantity.amount, "1250.50");
});

test("adding removes stale cart references while retaining valid lines", async () => {
  const healthy = {
    id: 77,
    items: [{ id: "keep", product: parent, variant, quantity: 2 }],
  };
  const calls = transport({
    "GET /api/carts/77": [
      {
        ...healthy,
        items: [...healthy.items, { id: "removed", product: 999, quantity: 1 }],
      },
      healthy,
    ],
    "GET /api/products/2": parent,
    "GET /api/variants/1": variant,
    "PATCH /api/carts/77": { doc: healthy },
    "POST /api/carts/77/add-item": { success: true, cart: healthy },
  });
  await addCartLines("77::test-secret", [
    { merchandiseId: "variant:1", quantity: 1 },
  ]);
  const patch = calls.find((call) => call.init.method === "PATCH");
  assert.deepEqual(JSON.parse(patch.init.body).items, [
    { id: "keep", product: 2, variant: 1, quantity: 2 },
  ]);
  assert.equal(patch.url.searchParams.get("secret"), "test-secret");
});

test("depth-zero mutation responses are populated before validating prices", async () => {
  const full = {
    id: 8,
    items: [{ id: "line", product: parent, variant, quantity: 2 }],
  };
  const shallow = {
    id: 8,
    items: [{ id: "line", product: 2, variant: 1, quantity: 2 }],
  };
  transport({
    "GET /api/products/2": parent,
    "GET /api/variants/1": variant,
    "GET /api/carts/8": full,
    "POST /api/carts/8/add-item": { success: true, cart: shallow },
    "POST /api/carts/8/update-item": { success: true, cart: shallow },
    "POST /api/carts/8/remove-item": { success: true, cart: shallow },
  });
  const added = await addCartLines("8::test-secret", [
    { merchandiseId: "variant:1", quantity: 1 },
  ]);
  const updated = await updateCartLines("8::test-secret", [
    { id: "line", quantity: 2 },
  ]);
  const removed = await removeCartLines("8::test-secret", ["another-line"]);
  for (const result of [added, updated, removed]) {
    assert.equal(result.lines[0].cost.amountPerQuantity.amount, "1250.50");
    assert.equal(result.id, "8::test-secret");
  }
});

test("actual add-cart request contains correct product/variant numeric IDs", async () => {
  const cart = {
    id: 8,
    items: [{ id: 55, product: parent, variant, quantity: 1 }],
  };
  const calls = transport({
    "GET /api/products/2": parent,
    "GET /api/variants/1": variant,
    "POST /api/carts/8/add-item": { success: true, cart },
    "GET /api/carts/8": cart,
  });
  const result = await addCartLines("8::fixture-secret", [
    { merchandiseId: "variant:1", quantity: 1 },
  ]);
  const mutation = calls.find((c) => c.init.method === "POST");
  assert.deepEqual(JSON.parse(mutation.init.body).item, {
    product: 2,
    variant: 1,
  });
  assert.equal(result.lines[0].merchandise.id, "variant:1");
});

test("unconfigured Payload fails explicitly and Shopify opaque GIDs remain unchanged", () => {
  delete process.env.PAYLOAD_ECOMMERCE_URL;
  assert.throws(() => mapProduct(simple), CommerceConfigError);
  const id = "gid://shopify/ProductVariant/1";
  assert.equal(
    mapShopifyVariant({
      id,
      title: "100g",
      price: { amount: "10.00", currencyCode: "ARS" },
    }).id,
    id,
  );
});
