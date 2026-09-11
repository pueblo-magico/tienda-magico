import assert from "node:assert/strict";
import { test, beforeEach } from "node:test";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import ts from "typescript";
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

test("los tipos poblados del producto resuelven etiquetas de opciones superficiales en ficha y carrito", () => {
  const product = {
    ...parent,
    variantTypes: [{ id: 5, label: { es: "Tamaño", en: "Size" } }],
    variants: [
      { ...variant, options: [{ id: 10, label: "100 g", variantType: 5 }] },
    ],
  };
  for (const [locale, label] of [
    ["es", "Tamaño"],
    ["en", "Size"],
  ]) {
    const mapped = mapProduct(product, locale);
    assert.equal(mapped.options[0].name, label);
    assert.equal(mapped.variants[0].selectedOptions[0].optionId, "5");
    const cart = mapCart(
      {
        id: 1,
        currency: "ARS",
        items: [
          {
            id: "line",
            product,
            variant: product.variants[0],
            quantity: 1,
            amount: variant.priceInARS,
          },
        ],
      },
      { locale },
    );
    assert.equal(cart.lines[0].merchandise.selectedOptions[0].name, label);
  }
});

test("el storefront respeta el orden editorial de las variantes vendibles", () => {
  const product = mapProduct({
    ...parent,
    variants: [
      { ...variant, id: 3, sortOrder: 20 },
      { ...variant, id: 4, options: [11], sortOrder: 10 },
      { ...variant, id: 5, options: [12] },
    ],
  });
  assert.deepEqual(
    product.variants.map((item) => item.id),
    ["variant:4", "variant:3", "variant:5"],
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

test("el SKU persiste al activar variantes y no se puede cambiar ni vaciar por API", async () => {
  for (const slug of ["products", "variants"]) {
    const originalDoc = slug === "products" ? simple : variant;
    const context = req(parent);
    for (const sku of ["OTRO", "", null]) {
      await assert.rejects(
        validateSellableItem({
          data: { sku, enableVariants: true },
          originalDoc,
          collection: { slug },
          req: context,
        }),
        (error) => error.data.errors[0].path === "sku",
      );
    }
    const saved = await validateSellableItem({
      data: { inventory: 2, enableVariants: true },
      originalDoc,
      collection: { slug },
      req: context,
    });
    assert.equal(saved.inventory, 2);
    assert.equal(saved.sku, originalDoc.sku);
    const normalized = await validateSellableItem({
      data: { sku: ` ${originalDoc.sku.toLowerCase()} `, enableVariants: true },
      originalDoc,
      collection: { slug },
      req: context,
    });
    assert.equal(normalized.sku, originalDoc.sku);
  }
  const saved = await validateSellableItem({
    data: { sku: " nuevo-sku " },
    originalDoc: { ...simple, sku: null },
    collection: { slug: "products" },
    req: req(),
  });
  assert.equal(saved.sku, "NUEVO-SKU");
});

test("un SKU nuevo de variante puede corregirse después de un error y queda estable al guardarlo", async () => {
  const originalDoc = { ...variant, sku: null, _status: "draft" };
  const context = req(parent);
  const save = (data, original = originalDoc) =>
    validateSellableItem({
      data,
      originalDoc: original,
      collection: { slug: "variants" },
      req: context,
    });
  await assert.rejects(save({ sku: "PRIMERO", netContent: -1 }));
  const saved = await save({ sku: " corregido " });
  assert.equal(saved.sku, "CORREGIDO");
  await assert.rejects(save({ sku: "OTRO" }, { ...originalDoc, ...saved }));
  for (const locale of ["es", "en"]) {
    context.locale = locale;
    await assert.rejects(
      save({ sku: null }, { ...originalDoc, ...saved }),
      (error) => {
        assert.equal(error.data.errors[0].path, "sku");
        assert.match(
          error.data.errors[0].message,
          locale === "es" ? /no se puede cambiar/ : /cannot be changed/,
        );
        return true;
      },
    );
  }
});

test("una actualización parcial de variante conserva producto y opciones para Payload", async () => {
  const saved = await validateSellableItem({
    data: { priceInARS: 600050 },
    originalDoc: {
      ...variant,
      _status: "draft",
      combinationKey: "2:10",
    },
    collection: { slug: "variants" },
    req: req(parent),
  });
  assert.equal(saved.product, variant.product);
  assert.deepEqual(saved.options, variant.options);
  assert.equal(saved.combinationKey, "2:10");
});

test("el campo SKU delega en Payload y se bloquea solo con datos guardados o permisos", async () => {
  const source = await readFile(
    new URL("../apps/cms/src/components/StableSKUField.tsx", import.meta.url),
    "utf8",
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  let document = { id: 1, data: { sku: null } };
  const TextField = () => null;
  const exports = {};
  runInNewContext(compiled, {
    exports,
    require: (name) => {
      if (name === "@payloadcms/ui")
        return { TextField, useDocumentInfo: () => document };
      if (name === "react/jsx-runtime")
        return { jsx: (type, props) => ({ type, props }) };
      throw new Error(`Módulo inesperado: ${name}`);
    },
  });
  const field = {
    name: "sku",
    label: { es: "SKU", en: "SKU" },
    admin: { description: "Ayuda" },
  };
  const validate = () => true;
  const props = { path: "sku", field, validate };
  for (const value of ["", "N", "NUEVO-SKU"]) {
    const rendered = exports.default({ ...props, value });
    assert.equal(rendered.type, TextField);
    assert.equal(rendered.props.readOnly, false);
    assert.equal(rendered.props.field, field);
    assert.equal(rendered.props.validate, validate);
    assert.equal(rendered.props.path, "sku");
  }
  assert.equal(
    exports.default({ ...props, readOnly: true }).props.readOnly,
    true,
  );
  assert.equal(
    exports.default({
      ...props,
      field: { ...field, admin: { readOnly: true } },
    }).props.readOnly,
    true,
  );
  document = { id: 1, data: { sku: "NUEVO-SKU" } };
  assert.equal(exports.default(props).props.readOnly, true);
  document = { data: { sku: "COPIA" } };
  assert.equal(exports.default(props).props.readOnly, false);
  for (const sku of [undefined, null, "", "   "]) {
    document = { id: 1, data: { sku } };
    assert.equal(exports.default(props).props.readOnly, false);
  }
  document = { id: 1 };
  assert.equal(exports.default(props).props.readOnly, false);
  document = { id: 0, data: { sku: "SKU-CERO" } };
  assert.equal(
    exports.default({ ...props, readOnly: false }).props.readOnly,
    true,
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
  await assert.rejects(
    validateSellableItem({
      data: variant,
      collection: { slug: "variants" },
      req: req(legacyParent),
    }),
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

test("guardar y comprar comparten las reglas de tipos configurados", async () => {
  for (const configuration of [
    { enableVariants: true, variantTypes: [5] },
    { enableVariants: true, variantTypes: [5, { id: 5 }] },
    { enableVariants: true, variantTypes: [] },
    { enableVariants: false, variantTypes: [5] },
    { enableVariants: true, variantTypes: [6] },
  ]) {
    const product = { ...parent, ...configuration };
    const context = req(product);
    context.payload.findByID = async ({ collection, draft }) => {
      assert.equal(draft, collection === "variantOptions" ? undefined : false);
      return collection === "products"
        ? product
        : collection === "variants"
          ? { ...variant, options: [{ id: 10, variantType: { id: 5 } }] }
          : { id: 10, variantType: 5 };
    };
    const save = () =>
      validateSellableItem({
        data: variant,
        collection: { slug: "variants" },
        req: context,
      });
    const add = () =>
      validateCartItems({
        data: {
          currency: "ARS",
          items: [{ product: 2, variant: 3, quantity: 1 }],
        },
        req: context,
      });
    if (configuration.enableVariants && configuration.variantTypes[0] === 5) {
      assert.equal((await save()).combinationKey, "2:10");
      assert.equal((await add()).items[0].amount, variant.priceInARS);
    } else {
      await assert.rejects(save());
      await assert.rejects(add());
    }
  }
});

test("el borrador usa la configuración editorial y publicar exige la configuración pública", async () => {
  const context = req(parent);
  let publicProduct = { ...parent, variantTypes: [] };
  context.payload.findByID = async ({ collection, draft }) =>
    collection === "products"
      ? draft
        ? parent
        : publicProduct
      : { id: 10, variantType: 5 };
  const save = (status) =>
    validateSellableItem({
      data: { ...variant, _status: status },
      collection: { slug: "variants" },
      req: context,
    });
  assert.equal((await save("draft")).combinationKey, "2:10");
  await assert.rejects(
    save("published"),
    (error) => error.data.errors[0].path === "product",
  );
  publicProduct = parent;
  assert.equal((await save("published")).combinationKey, "2:10");
  publicProduct = { ...parent, _status: "draft" };
  assert.equal((await save("published")).combinationKey, "2:10");
});

test("las opciones sin tipo o repetidas no permiten publicar ni comprar", async () => {
  for (const options of [
    [{ id: 10, variantType: null }],
    [
      { id: 10, variantType: 5 },
      { id: 11, variantType: 5 },
    ],
    [],
  ]) {
    const context = req(parent);
    context.payload.findByID = async ({ collection, id }) =>
      collection === "products"
        ? parent
        : collection === "variants"
          ? { ...variant, options }
          : options.find((option) => option.id === id);
    await assert.rejects(
      validateSellableItem({
        data: { ...variant, options: options.map((option) => option.id) },
        collection: { slug: "variants" },
        req: context,
      }),
    );
    await assert.rejects(
      validateCartItems({
        data: {
          currency: "ARS",
          items: [{ product: 2, variant: 3, quantity: 1 }],
        },
        req: context,
      }),
    );
  }
});

test("dos tipos admiten borradores parciales y publican una combinación completa sin depender del orden", async () => {
  const product = { ...parent, variantTypes: [6, 5] };
  const options = [
    { id: 10, variantType: 5 },
    { id: 20, variantType: 6 },
  ];
  const context = req(product);
  context.payload.findByID = async ({ collection, id }) =>
    collection === "products"
      ? product
      : collection === "variants"
        ? { ...variant, options: [...options].reverse() }
        : options.find((option) => option.id === id);
  const save = (selected, status = "draft", originalDoc = {}) =>
    validateSellableItem({
      data: { ...variant, options: selected, _status: status },
      originalDoc,
      collection: { slug: "variants" },
      req: context,
    });
  assert.equal((await save([10])).combinationKey, null);
  await assert.rejects(save([10], "published"));
  await assert.rejects(save([10, 10]));
  assert.equal((await save([20, 10], "published")).combinationKey, "2:10,20");
  await assert.rejects(save([10], "draft", { combinationKey: "2:10,20" }));
  const cart = await validateCartItems({
    data: { currency: "ARS", items: [{ product: 2, variant: 3, quantity: 1 }] },
    req: context,
  });
  assert.equal(cart.items[0].amount, variant.priceInARS);
});

test("la configuración ausente devuelve ayuda localizada en el campo producto", async () => {
  for (const locale of ["es", "en"]) {
    const context = { ...req({ ...parent, variantTypes: [] }), locale };
    await assert.rejects(
      validateSellableItem({
        data: variant,
        collection: { slug: "variants" },
        req: context,
      }),
      (error) => {
        const detail = error.data.errors[0];
        assert.equal(detail.path, "product");
        assert.match(
          detail.message,
          locale === "es" ? /Activá las variantes/ : /Enable variants/,
        );
        return true;
      },
    );
  }
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
