import assert from "node:assert/strict";
import { test } from "node:test";
import {
  validateProductPublication,
  protectPublishedVariant,
  protectDeletedVariant,
} from "../apps/cms/src/collections/productPublication.ts";

const variant = {
  id: 2,
  product: 1,
  _status: "published",
  priceInARSEnabled: true,
  priceInARS: 100,
  inventory: 0,
};
const product = { id: 1, _status: "published", enableVariants: true };
function request(docs = [], parent = product) {
  return {
    locale: "es",
    payload: {
      find: async (args) => {
        assert.equal(args.req.locale, "es");
        assert.equal(args.draft, false);
        return { docs };
      },
      findByID: async ({ collection }) =>
        collection === "products" ? parent : variant,
    },
  };
}
test("publication rejects missing variants, permits drafts and sold-out variants", async () => {
  await assert.rejects(
    validateProductPublication({
      data: product,
      originalDoc: product,
      req: request(),
    }),
    { name: "ValidationError" },
  );
  await validateProductPublication({
    data: { ...product, _status: "draft" },
    req: request(),
  });
  await validateProductPublication({
    data: product,
    originalDoc: product,
    req: request([variant]),
  });
});
test("simple publication requires enabled valid ARS pricing, not positive inventory", async () => {
  for (const price of [undefined, 0, -1, NaN, 1.5]) {
    await assert.rejects(
      validateProductPublication({
        data: {
          ...product,
          enableVariants: false,
          priceInARSEnabled: true,
          priceInARS: price,
        },
        req: request(),
      }),
    );
  }
  await validateProductPublication({
    data: {
      ...product,
      enableVariants: false,
      priceInARSEnabled: true,
      priceInARS: 100,
      inventory: 0,
    },
    req: request(),
  });
});
test("last eligible variant cannot be unpublished, unpriced, moved or deleted", async () => {
  for (const data of [
    { _status: "draft" },
    { priceInARSEnabled: false },
    { priceInARS: -1 },
    { product: 99 },
  ]) {
    await assert.rejects(
      protectPublishedVariant({ data, originalDoc: variant, req: request() }),
      { name: "ValidationError" },
    );
  }
  await assert.rejects(protectDeletedVariant({ id: 2, req: request() }), {
    name: "ValidationError",
  });
});
test("ordinary stock edits, another eligible variant or draft parent allow changes", async () => {
  await protectPublishedVariant({
    data: { inventory: 0 },
    originalDoc: variant,
    req: request(),
  });
  await protectDeletedVariant({ id: 2, req: request([{ ...variant, id: 3 }]) });
  await protectDeletedVariant({
    id: 2,
    req: request([], { ...product, _status: "draft" }),
  });
});

test("first publication requires both locales for critical editorial copy", async () => {
  await assert.rejects(
    validateProductPublication({
      data: {
        id: 9,
        _status: "published",
        enableVariants: false,
        priceInARSEnabled: true,
        priceInARS: 100,
        title: { es: "Cacao", en: "" },
        summary: { es: "Ceremonial", en: "Ceremonial" },
      },
      req: request(),
    }),
    { name: "ValidationError" },
  );
  await validateProductPublication({
    data: {
      id: 9,
      _status: "published",
      enableVariants: false,
      priceInARSEnabled: true,
      priceInARS: 100,
      title: { es: "Cacao", en: "Cacao" },
      summary: { es: "Ceremonial", en: "Ceremonial" },
    },
    req: request(),
  });
});

test("first publication timestamp is system-owned and remains stable", async () => {
  const draftWithoutHistory = await validateProductPublication({
    data: { _status: "draft", firstPublishedAt: "malicious" },
    req: request(),
  });
  assert.equal(draftWithoutHistory.firstPublishedAt, null);

  const first = await validateProductPublication({
    data: {
      id: 9,
      _status: "published",
      enableVariants: false,
      priceInARSEnabled: true,
      priceInARS: 100,
      title: { es: "Cacao", en: "Cacao" },
      summary: { es: "Ceremonial", en: "Ceremonial" },
      firstPublishedAt: "2000-01-01T00:00:00.000Z",
    },
    req: request(),
  });
  assert.equal(typeof first.firstPublishedAt, "string");
  assert.notEqual(first.firstPublishedAt, "2000-01-01T00:00:00.000Z");
  assert.equal(Number.isNaN(Date.parse(first.firstPublishedAt)), false);

  const originalDoc = {
    ...product,
    firstPublishedAt: first.firstPublishedAt,
  };
  const draft = await validateProductPublication({
    data: { _status: "draft", firstPublishedAt: "malicious" },
    originalDoc,
    req: request(),
  });
  assert.equal(draft.firstPublishedAt, first.firstPublishedAt);

  const republished = await validateProductPublication({
    data: { _status: "published", firstPublishedAt: "malicious" },
    originalDoc: { ...originalDoc, _status: "draft" },
    req: request([variant]),
  });
  assert.equal(republished.firstPublishedAt, first.firstPublishedAt);
});
