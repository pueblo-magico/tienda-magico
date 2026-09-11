import assert from "node:assert/strict";
import { test, beforeEach } from "node:test";
import {
  mapProduct,
  mapCart,
  mapMoney,
} from "@/lib/commerce/providers/payload-ecommerce/mappers";
import { validateCheckoutCart } from "@/lib/checkout/validate-cart";
import { cartToPreferenceItems } from "@/lib/checkout/providers/mercado-pago/map-cart";
import {
  validateSellableItem,
  sellableFields,
} from "../apps/cms/src/collections/sellableItems.ts";
import { validateCartItems } from "../apps/cms/src/collections/cartCommercialValidation.ts";
beforeEach(() => {
  process.env.PAYLOAD_ECOMMERCE_URL = "http://cms.test";
  process.env.PAYLOAD_ECOMMERCE_CURRENCY = "ARS";
  process.env.PAYLOAD_ECOMMERCE_AMOUNT_IS_CENTS = "true";
});
const simple = {
  id: 1,
  slug: "taza",
  sku: "TAZA-1",
  _status: "published",
  enableVariants: false,
  inventory: 3,
  priceInARSEnabled: true,
  priceInARS: 125050,
};
const parent = { ...simple, id: 2, enableVariants: true, variantTypes: [5] };
const variant = {
  ...simple,
  id: 3,
  product: 2,
  options: [10],
  sku: "CACAO-100",
  netContent: 100,
  netContentUnit: "g",
};
const req = (item = simple, duplicates = []) => ({
  locale: "es",
  payload: {
    find: async () => ({ docs: duplicates }),
    findByID: async ({ collection }) =>
      collection === "variantOptions"
        ? { id: 10, variantType: 5 }
        : collection === "variants"
          ? item
          : item.enableVariants
            ? item
            : simple,
  },
});

test("ARS usa centavos enteros y excluye precios inválidos o desactivados", () => {
  assert.equal(mapMoney(125050).amount, "1250.50");
  assert.equal(mapMoney(Number.MAX_SAFE_INTEGER).amount, "90071992547409.91");
  for (const price of [undefined, null, 0, -1, 1.5, "100", Infinity]) {
    assert.equal(
      mapProduct({ ...simple, priceInARS: price }).availableForSale,
      false,
    );
  }
  assert.equal(
    mapProduct({ ...simple, priceInARSEnabled: false }).availableForSale,
    false,
  );
});

test("el rango solo incluye variantes comprables y mantiene identidad, medidas y medios", () => {
  const product = mapProduct({
    ...parent,
    variants: [
      { ...variant, priceInARS: 100, inventory: 0 },
      { ...variant, id: 4, priceInARS: 500, lifecycleStatus: "discontinued" },
      {
        ...variant,
        id: 5,
        options: [
          { id: 10, label: "100 g", variantType: { id: 5, label: "Tamaño" } },
        ],
        priceInARS: 250050,
        image: { url: "/cacao.webp" },
        oneOfAKind: true,
        packedWeightGrams: 150,
      },
    ],
  });
  assert.equal(product.priceRange.minVariantPrice.amount, "2500.50");
  assert.equal(product.variants[2].maxPurchaseQuantity, 1);
  assert.equal(product.variants[2].netContent.quantity, 100);
  assert.ok(product.variants[2].image.url.endsWith("/cacao.webp"));
  assert.equal(product.variants[2].quantityAvailable, null);
  assert.ok(!JSON.stringify(product).includes("packedWeightGrams"));
});

test("el CMS valida SKU estable, duplicados y medidas sin cambiar precios existentes", async () => {
  const validate = (data, originalDoc = {}) =>
    validateSellableItem({
      data,
      originalDoc,
      collection: { slug: "products" },
      req: req(),
    });
  assert.equal((await validate({ ...simple, sku: " taza-1 " })).sku, "TAZA-1");
  await assert.rejects(validate({ ...simple, sku: "OTRO" }, simple));
  for (const data of [
    { sku: "" },
    { priceInARS: 0 },
    { priceInARS: 1.5 },
    { netContent: 0 },
    { netContent: 100 },
    { packageWidthMm: -1 },
    { oneOfAKind: true, inventory: 2 },
  ]) {
    await assert.rejects(validate({ ...simple, ...data }));
  }
  await assert.rejects(
    validateSellableItem({
      data: simple,
      collection: { slug: "products" },
      req: req(simple, [{ id: 9 }]),
    }),
  );
});

test("el CMS exige una opción por tipo y rechaza combinaciones repetidas", async () => {
  const context = req(parent);
  const valid = await validateSellableItem({
    data: variant,
    collection: { slug: "variants" },
    req: context,
  });
  assert.equal(valid.combinationKey, "2:10");
  const legacyParent = { ...parent, variantTypes: [] };
  assert.equal(
    (
      await validateSellableItem({
        data: variant,
        collection: { slug: "variants" },
        req: req(legacyParent),
      })
    ).combinationKey,
    "2:10",
  );
  const duplicateTypeParent = { ...parent, variantTypes: [5, 5] };
  assert.equal(
    (
      await validateSellableItem({
        data: variant,
        collection: { slug: "variants" },
        req: req(duplicateTypeParent),
      })
    ).combinationKey,
    "2:10",
  );
  await assert.rejects(
    validateSellableItem({
      data: { ...variant, options: [10, 10] },
      collection: { slug: "variants" },
      req: context,
    }),
  );
  context.payload.find = async ({ where }) => ({
    docs: where.and.some((entry) => entry.combinationKey) ? [{ id: 9 }] : [],
  });
  await assert.rejects(
    validateSellableItem({
      data: variant,
      collection: { slug: "variants" },
      req: context,
    }),
  );
});

test("el CMS permite guardar una variante nueva incompleta antes de publicarla", async () => {
  const context = req(parent);
  const incomplete = await validateSellableItem({
    data: { product: parent.id, options: [], sku: "CACAO-BORRADOR" },
    collection: { slug: "variants" },
    req: context,
  });
  assert.equal(incomplete.combinationKey, null);
  const complete = await validateSellableItem({
    data: { product: parent.id, options: [10], sku: "CACAO-PARCIAL" },
    collection: { slug: "variants" },
    req: context,
  });
  assert.equal(complete.combinationKey, "2:10");
});

test("las medidas de envío quedan privadas para visitantes y clientes", () => {
  const field = sellableFields.find(
    (field) => field.name === "packedWeightGrams",
  );
  assert.equal(field.access.read({ req: {} }), false);
  assert.equal(
    field.access.read({ req: { user: { roles: ["customer"] } } }),
    false,
  );
  assert.equal(
    field.access.read({ req: { user: { roles: ["admin"] } } }),
    true,
  );
});

test("el CMS bloquea cantidades inválidas y acumulación de piezas únicas", async () => {
  const context = req();
  const validate = (items) =>
    validateCartItems({ data: { currency: "ARS", items }, req: context });
  await validate([{ product: 1, quantity: 1 }]);
  for (const quantity of [0, -1, 1.5, 4])
    await assert.rejects(validate([{ product: 1, quantity }]));
  context.payload.findByID = async () => ({ ...simple, oneOfAKind: true });
  await assert.rejects(
    validate([
      { product: 1, quantity: 1 },
      { product: 1, quantity: 1 },
    ]),
  );
});

test("los carritos conservan líneas inválidas para quitarlas y bloquean checkout", () => {
  const cart = mapCart({
    id: 5,
    items: [
      {
        id: "old",
        product: { ...simple, lifecycleStatus: "discontinued" },
        quantity: 1,
      },
    ],
  });
  assert.equal(cart.lines[0].id, "old");
  assert.equal(cart.lines[0].issue, "unavailable");
  assert.throws(() => validateCheckoutCart(cart, "es"), { status: 409 });
});

test("el cambio de precio exige confirmación y mantiene ARS al pagar", () => {
  const snapshot = {
    id: 5,
    subtotal: 100,
    items: [{ id: "line", product: simple, quantity: 1 }],
  };
  const changed = mapCart(snapshot);
  assert.equal(changed.lines[0].issue, "priceChanged");
  assert.throws(() => validateCheckoutCart(changed, "en"), { status: 409 });
  const refreshed = mapCart({
    ...snapshot,
    subtotal: simple.priceInARS,
    items: snapshot.items.map((item) => ({
      ...item,
      amount: simple.priceInARS,
    })),
  });
  validateCheckoutCart(refreshed, "es");
  const item = cartToPreferenceItems(refreshed)[0];
  assert.equal(item.id, "product:1");
  assert.equal(item.unit_price, 1250.5);
  assert.equal(item.currency_id, "ARS");
});

test("detecta cambios de precio por línea aunque el subtotal no cambie", () => {
  const cart = mapCart({
    id: 7,
    subtotal: 300,
    items: [
      {
        id: "a",
        product: { ...simple, priceInARS: 100 },
        amount: 150,
        quantity: 1,
      },
      {
        id: "b",
        product: { ...simple, id: 2, priceInARS: 200 },
        amount: 150,
        quantity: 1,
      },
    ],
  });
  assert.deepEqual(
    cart.lines.map((line) => line.issue),
    ["priceChanged", "priceChanged"],
  );
  assert.throws(() => validateCheckoutCart(cart, "es"), { status: 409 });
});

test("quitar una línea permite conservar otra no disponible para revisión", async () => {
  const items = [
    { id: "a", product: 1, quantity: 1 },
    { id: "b", product: 2, quantity: 1 },
  ];
  const result = await validateCartItems({
    originalDoc: { currency: "ARS", items },
    data: { items: [items[1]] },
    req: {
      locale: "es",
      payload: {
        findByID: async () => {
          throw new Error(
            "No debe consultar artículos durante una eliminación",
          );
        },
      },
    },
  });
  assert.deepEqual(result.items, [{ ...items[1], amount: null }]);
});

test("quitar otra línea no permite aceptar ni falsificar precios", async () => {
  const items = [
    { id: "a", product: 1, quantity: 1, amount: 100 },
    { id: "b", product: 2, quantity: 1, amount: 200 },
  ];
  const result = await validateCartItems({
    originalDoc: { currency: "ARS", items },
    data: { acceptCurrentPrices: true, items: [{ ...items[1], amount: 999 }] },
    req: { locale: "es" },
  });
  assert.equal(result.items[0].amount, 200);
});
