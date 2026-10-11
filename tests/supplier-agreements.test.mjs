import assert from "node:assert/strict";
import { test } from "node:test";

import { Suppliers } from "../apps/cms/src/collections/Suppliers.ts";
import { SupplierAgreements } from "../apps/cms/src/collections/SupplierAgreements.ts";
import * as supplierAgreementModule from "../apps/cms/src/collections/SupplierAgreements.ts";
import { Users } from "../apps/cms/src/collections/Users.ts";
import { productsCollectionOverride } from "../apps/cms/src/collections/Products.ts";
import {
  formatScaledNumberInput,
  parseScaledNumberInput,
} from "../apps/cms/src/utilities/scaledNumberInput.ts";
import {
  getIsoCurrencyCodes,
  ISO_COUNTRY_CODES,
} from "../apps/cms/src/utilities/isoOptions.ts";
import {
  purchasingFields,
  resolveEffectiveCommercialTerms,
  validateCommercialTerms,
  validatePurchasingData,
} from "../apps/cms/src/collections/commercialAgreements.ts";
import * as commercialAgreementModule from "../apps/cms/src/collections/commercialAgreements.ts";
import { mapProduct } from "@/lib/commerce/providers/payload-ecommerce/mappers";

process.env.PAYLOAD_ECOMMERCE_URL = "http://cms.test";
process.env.PAYLOAD_ECOMMERCE_CURRENCY = "ARS";
process.env.PAYLOAD_ECOMMERCE_AMOUNT_IS_CENTS = "true";

const namedField = (fields, name) =>
  fields.find((field) => "name" in field && field.name === name);

const findNestedField = (fields, name) => {
  for (const field of fields) {
    if ("name" in field && field.name === name) return field;
    if ("fields" in field) {
      const nested = findNestedField(field.fields, name);
      if (nested) return nested;
    }
    if ("tabs" in field) {
      for (const tab of field.tabs) {
        const nested = findNestedField(tab.fields, name);
        if (nested) return nested;
      }
    }
  }
};

test("proveedores queda restringido a compras, finanzas y administración", () => {
  for (const operation of ["read", "create", "update", "delete"]) {
    const access = Suppliers.access[operation];
    assert.equal(access({ req: {} }), false);
    assert.equal(access({ req: { user: { roles: ["customer"] } } }), false);
    assert.equal(access({ req: { user: { roles: ["purchasing"] } } }), true);
    assert.equal(access({ req: { user: { roles: ["finance"] } } }), true);
    assert.equal(access({ req: { user: { roles: ["admin"] } } }), true);
  }
});

test("las revisiones contractuales son privadas, versionadas y admiten alcance por variante", () => {
  for (const operation of ["read", "create", "update", "delete"]) {
    const access = SupplierAgreements.access[operation];
    assert.equal(access({ req: {} }), false);
    assert.equal(access({ req: { user: { roles: ["customer"] } } }), false);
    assert.equal(access({ req: { user: { roles: ["purchasing"] } } }), true);
    assert.equal(access({ req: { user: { roles: ["finance"] } } }), true);
    assert.equal(access({ req: { user: { roles: ["admin"] } } }), true);
  }
  assert.ok(SupplierAgreements.versions);
  assert.equal(SupplierAgreements.lockDocuments, false);
  assert.equal(
    namedField(SupplierAgreements.fields, "supplier").relationTo,
    "suppliers",
  );
  assert.equal(
    namedField(SupplierAgreements.fields, "product").relationTo,
    "products",
  );
  assert.equal(
    namedField(SupplierAgreements.fields, "variant").relationTo,
    "variants",
  );
  assert.equal(
    namedField(Suppliers.fields, "agreements").collection,
    "supplier-agreements",
  );
  assert.equal(namedField(Suppliers.fields, "agreements").on, "supplier");
  const percentageBasis = namedField(
    namedField(SupplierAgreements.fields, "terms").fields,
    "percentageBasis",
  );
  assert.deepEqual(
    percentageBasis.fields.map(({ dbName, name }) => [name, dbName]),
    [
      ["productDiscounts", "pct_product_discounts"],
      ["orderDiscounts", "pct_order_discounts"],
      ["taxes", "pct_taxes"],
      ["shipping", "pct_shipping"],
      ["tipsDonations", "pct_tips_donations"],
      ["paymentFees", "pct_payment_fees"],
    ],
  );
});

test("la resolución versionada prioriza variante, producto y proveedor y detecta ambigüedad", () => {
  assert.equal(
    typeof supplierAgreementModule.selectEffectiveSupplierAgreement,
    "function",
  );
  const select = supplierAgreementModule.selectEffectiveSupplierAgreement;
  const base = {
    supplier: 9,
    revision: 1,
    status: "active",
    terms: {
      mode: "purchase",
      effectiveFrom: "2026-01-01T00:00:00.000Z",
    },
  };
  const supplier = { ...base, id: 1, product: null, variant: null };
  const product = { ...base, id: 2, product: 7, variant: null };
  const variant = { ...base, id: 3, product: 7, variant: 11 };

  assert.deepEqual(
    select([supplier, product, variant], {
      supplier: 9,
      product: 7,
      variant: 11,
      effectiveAt: "2026-10-11T12:00:00.000Z",
    }),
    { kind: "resolved", scope: "variant", agreement: variant },
  );
  assert.deepEqual(
    select([supplier, product], {
      supplier: 9,
      product: 7,
      effectiveAt: "2026-10-11T12:00:00.000Z",
    }),
    { kind: "resolved", scope: "product", agreement: product },
  );
  assert.deepEqual(
    select([supplier], {
      supplier: 9,
      product: 7,
      effectiveAt: "2026-10-11T12:00:00.000Z",
    }),
    { kind: "resolved", scope: "supplier", agreement: supplier },
  );
  assert.equal(
    select([{ ...product, id: 4 }, product], {
      supplier: 9,
      product: 7,
      effectiveAt: "2026-10-11T12:00:00.000Z",
    }).kind,
    "ambiguous",
  );
});

test("la publicación consulta acuerdos versionados y conserva un fallback legado explícito", async () => {
  assert.equal(
    typeof supplierAgreementModule.validateProductAgreementCoverage,
    "function",
  );
  let findOptions;
  const req = {
    payload: {
      find: async (options) => {
        findOptions = options;
        return { docs: [] };
      },
      findByID: async () => ({
        id: 9,
        defaultTerms: {
          mode: "purchase",
          effectiveFrom: "2026-01-01T00:00:00.000Z",
        },
      }),
    },
  };

  const result = await supplierAgreementModule.validateProductAgreementCoverage(
    {
      data: {
        _status: "published",
        supplier: 9,
        termsOverride: { mode: "inherit" },
      },
      originalDoc: { id: 7, _status: "draft" },
      req,
    },
  );

  assert.equal(findOptions.collection, "supplier-agreements");
  assert.deepEqual(result, {
    _status: "published",
    supplier: 9,
    termsOverride: { mode: "inherit" },
  });
  await assert.rejects(() =>
    supplierAgreementModule.validateProductAgreementCoverage({
      data: {
        _status: "published",
        supplier: 9,
        termsOverride: { mode: "inherit" },
      },
      originalDoc: { id: 7, _status: "draft" },
      req: {
        payload: {
          find: async () => ({ docs: [] }),
          findByID: async () => ({ id: 9, defaultTerms: null }),
        },
      },
    }),
  );
});

test("la activación revisa todos los acuerdos activos del proveedor", async () => {
  let findOptions;
  const transaction = { execute: async () => ({ rows: [] }) };
  const req = {
    transactionID: Promise.resolve("agreement-test"),
    user: { id: 3, roles: ["finance"] },
    payload: {
      db: {
        name: "postgres",
        sessions: { "agreement-test": { db: transaction } },
      },
      find: async (options) => {
        findOptions = options;
        return { docs: [] };
      },
    },
  };

  await SupplierAgreements.hooks.beforeChange[0]({
    data: {
      reference: "ACUERDO-001",
      supplier: 9,
      revision: 1,
      status: "active",
      terms: {
        mode: "purchase",
        effectiveFrom: "2026-10-11T00:00:00.000Z",
      },
    },
    req,
  });

  assert.equal(findOptions.limit, 0);
  assert.equal(findOptions.pagination, false);
  assert.deepEqual(findOptions.where.and[1], {
    status: { in: ["active", "expired", "terminated"] },
  });
});

test("la activación rechaza vigencias superpuestas para el mismo alcance", async () => {
  const transaction = { execute: async () => ({ rows: [] }) };
  const req = {
    transactionID: Promise.resolve("agreement-overlap"),
    user: { id: 3, roles: ["finance"] },
    payload: {
      db: {
        name: "postgres",
        sessions: { "agreement-overlap": { db: transaction } },
      },
      find: async () => ({
        docs: [
          {
            id: 41,
            supplier: 9,
            product: 7,
            variant: null,
            revision: 1,
            status: "expired",
            terms: {
              mode: "purchase",
              effectiveFrom: "2026-10-01T00:00:00.000Z",
            },
          },
        ],
      }),
    },
  };

  await assert.rejects(() =>
    SupplierAgreements.hooks.beforeChange[0]({
      data: {
        reference: "ACUERDO-002",
        supplier: 9,
        product: 7,
        revision: 1,
        status: "active",
        terms: {
          mode: "purchase",
          effectiveFrom: "2026-10-11T00:00:00.000Z",
        },
      },
      req,
    }),
  );
});

test("una revisión nueva exige un predecesor consecutivo del mismo alcance", async () => {
  const req = {
    user: { id: 3, roles: ["finance"] },
    payload: {
      findByID: async () => ({
        id: 41,
        supplier: 8,
        product: 7,
        revision: 1,
        status: "active",
        terms: {
          mode: "purchase",
          effectiveFrom: "2026-10-01T00:00:00.000Z",
        },
      }),
    },
  };

  await assert.rejects(() =>
    SupplierAgreements.hooks.beforeChange[0]({
      data: {
        reference: "ACUERDO-002-R2",
        supplier: 9,
        product: 7,
        revision: 2,
        previousAgreement: 41,
        status: "draft",
        terms: { mode: "purchase" },
      },
      req,
    }),
  );
});

test("una variante contractual debe pertenecer al producto seleccionado", async () => {
  await assert.rejects(() =>
    SupplierAgreements.hooks.beforeChange[0]({
      data: {
        reference: "ACUERDO-VARIANTE-INVALIDA",
        supplier: 9,
        product: 7,
        variant: 11,
        revision: 1,
        status: "draft",
        terms: { mode: "purchase" },
      },
      req: {
        payload: {
          findByID: async ({ collection }) => {
            assert.equal(collection, "variants");
            return { id: 11, product: 8 };
          },
        },
      },
    }),
  );
});

test("el mismo alcance no admite dos revisiones con igual número", async () => {
  const transaction = { execute: async () => ({ rows: [] }) };
  await assert.rejects(() =>
    SupplierAgreements.hooks.beforeChange[0]({
      data: {
        reference: "ACUERDO-DUPLICADO",
        supplier: 9,
        product: 7,
        revision: 1,
        status: "draft",
        terms: { mode: "purchase" },
      },
      req: {
        transactionID: Promise.resolve("agreement-duplicate"),
        payload: {
          db: {
            name: "postgres",
            sessions: { "agreement-duplicate": { db: transaction } },
          },
          find: async () => ({
            docs: [
              {
                id: 41,
                supplier: 9,
                product: 7,
                variant: null,
                revision: 1,
                status: "draft",
                terms: { mode: "purchase" },
              },
            ],
          }),
        },
      },
    }),
  );
});

test("los acuerdos aprobados no se eliminan y los borradores sí", async () => {
  const beforeDelete = SupplierAgreements.hooks.beforeDelete[0];
  await assert.rejects(() =>
    beforeDelete({
      id: 41,
      req: {
        payload: { findByID: async () => ({ id: 41, status: "active" }) },
      },
    }),
  );
  await assert.doesNotReject(() =>
    beforeDelete({
      id: 42,
      req: {
        payload: { findByID: async () => ({ id: 42, status: "draft" }) },
      },
    }),
  );
});

test("usuarios admite roles privados de compras y finanzas", () => {
  const roles = namedField(Users.fields, "roles");
  assert.ok(roles.options.some((option) => option.value === "editor"));
  assert.ok(roles.options.some((option) => option.value === "purchasing"));
  assert.ok(roles.options.some((option) => option.value === "finance"));
});

test("el producto permite proveedor, costo y una excepción contractual privada", () => {
  assert.equal(
    namedField(purchasingFields, "supplier").relationTo,
    "suppliers",
  );
  assert.ok(namedField(purchasingFields, "supplierSKU"));
  assert.ok(namedField(purchasingFields, "purchaseCost"));
  assert.ok(namedField(purchasingFields, "termsOverride"));
  assert.equal(
    namedField(purchasingFields, "agreementCoverage").admin.components.Field,
    "@/components/AgreementCoverageField",
  );
  for (const field of purchasingFields) {
    if (!("access" in field)) continue;
    for (const operation of ["create", "read", "update"]) {
      if (!field.access?.[operation]) continue;
      assert.equal(field.access[operation]({ req: {} }), false);
      assert.equal(
        field.access[operation]({ req: { user: { roles: ["customer"] } } }),
        false,
      );
      assert.equal(
        field.access[operation]({ req: { user: { roles: ["editor"] } } }),
        false,
      );
      assert.equal(
        field.access[operation]({ req: { user: { roles: ["purchasing"] } } }),
        true,
      );
    }
  }
});

test("acuerdos expone una consulta privada de cobertura efectiva", () => {
  const endpoint = SupplierAgreements.endpoints?.find(
    ({ method, path }) => method === "get" && path === "/effective",
  );
  assert.ok(endpoint);
});

test("porcentajes e importes usan entradas decimales sin exponer unidades internas", () => {
  const terms = namedField(purchasingFields, "termsOverride");
  assert.equal(
    namedField(terms.fields, "shareBps").admin.components.Field,
    "@/components/PercentageInputField",
  );
  assert.equal(
    namedField(terms.fields, "fixedMinor").admin.components.Field,
    "@/components/MoneyInputField",
  );
  assert.equal(
    namedField(
      namedField(purchasingFields, "purchaseCost").fields,
      "amountMinor",
    ).admin.components.Field,
    "@/components/MoneyInputField",
  );
  assert.equal(parseScaledNumberInput("35", 100), 3500);
  assert.equal(
    formatScaledNumberInput(3500, { scale: 100, suffix: "%" }),
    "35.00%",
  );
  assert.equal(parseScaledNumberInput("1.250,50", 100), 125050);
  assert.equal(parseScaledNumberInput("1,250.50", 100), 125050);
  assert.equal(formatScaledNumberInput(125050, { scale: 100 }), "1,250.50");
  assert.equal(parseScaledNumberInput("12.345", 100), 1234500);
  assert.equal(parseScaledNumberInput("12,345", 100), 1234500);
  assert.equal(parseScaledNumberInput("12.345,67", 100), 1234567);
  assert.equal(parseScaledNumberInput("12,345.67", 100), 1234567);
  assert.equal(parseScaledNumberInput("12.3456", 100), undefined);
});

test("todos los países editables y las monedas de compras usan selectores ISO", () => {
  const supplierCountry = namedField(Suppliers.fields, "country");
  assert.equal(
    supplierCountry.admin.components.Field,
    "@/components/IsoCountrySelectField",
  );

  const products = productsCollectionOverride({
    defaultCollection: { slug: "products", fields: [] },
  });
  assert.equal(
    findNestedField(products.fields, "countryOfOrigin").admin.components.Field,
    "@/components/IsoCountrySelectField",
  );

  const terms = namedField(purchasingFields, "termsOverride");
  assert.equal(
    namedField(terms.fields, "currency").admin.components.Field,
    "@/components/IsoCurrencySelectField",
  );
  assert.equal(
    namedField(namedField(purchasingFields, "purchaseCost").fields, "currency")
      .admin.components.Field,
    "@/components/IsoCurrencySelectField",
  );
  assert.ok(ISO_COUNTRY_CODES.includes("AR"));
  assert.ok(ISO_COUNTRY_CODES.includes("BR"));
  assert.ok(getIsoCurrencyCodes().includes("ARS"));
  assert.ok(getIsoCurrencyCodes().includes("BRL"));
});

test("compras y finanzas pueden guardar productos para administrar acuerdos", () => {
  const products = productsCollectionOverride({
    defaultCollection: {
      slug: "products",
      access: {
        create: ({ req }) => req.user?.roles?.includes("admin") ?? false,
        read: () => true,
        update: ({ req }) => req.user?.roles?.includes("admin") ?? false,
      },
      fields: [],
    },
  });

  for (const operation of ["create", "update"]) {
    const access = products.access[operation];
    assert.equal(access({ req: { user: { roles: ["customer"] } } }), false);
    assert.equal(access({ req: { user: { roles: ["editor"] } } }), true);
    assert.equal(access({ req: { user: { roles: ["purchasing"] } } }), true);
    assert.equal(access({ req: { user: { roles: ["finance"] } } }), true);
    assert.equal(access({ req: { user: { roles: ["admin"] } } }), true);
  }
});

test("valida compra y consignación sin porcentajes implícitos", () => {
  assert.deepEqual(
    validateCommercialTerms({ mode: "purchase" }, { allowInherit: false }),
    { mode: "purchase" },
  );
  assert.deepEqual(
    validateCommercialTerms(
      {
        mode: "consignment",
        method: "percentage",
        shareBps: 3500,
        percentageBasis: {
          productDiscounts: "deduct",
          orderDiscounts: "deduct_allocated",
          taxes: "exclude",
          shipping: "exclude",
          tipsDonations: "exclude",
          paymentFees: "store_absorbs",
        },
      },
      { allowInherit: false },
    ),
    {
      mode: "consignment",
      method: "percentage",
      shareBps: 3500,
      percentageBasis: {
        productDiscounts: "deduct",
        orderDiscounts: "deduct_allocated",
        taxes: "exclude",
        shipping: "exclude",
        tipsDonations: "exclude",
        paymentFees: "store_absorbs",
      },
    },
  );
  assert.throws(() =>
    validateCommercialTerms(
      {
        mode: "consignment",
        method: "percentage",
        shareBps: 3500,
      },
      { allowInherit: false },
    ),
  );
  assert.throws(() =>
    validateCommercialTerms(
      {
        mode: "consignment",
        method: "percentage",
        shareBps: 3500,
        percentageBasis: {
          productDiscounts: "deduct",
          orderDiscounts: "deduct_allocated",
          taxes: "exclude",
          shipping: "exclude",
          tipsDonations: "exclude",
          paymentFees: "invalid",
        },
      },
      { allowInherit: false },
    ),
  );
  assert.throws(() =>
    validateCommercialTerms({ mode: "consignment" }, { allowInherit: false }),
  );
  assert.throws(() =>
    validateCommercialTerms(
      {
        mode: "consignment",
        method: "percentage",
        shareBps: 0,
      },
      { allowInherit: false },
    ),
  );
  assert.throws(() =>
    validateCommercialTerms(
      {
        mode: "consignment",
        method: "fixed",
        fixedMinor: 500,
      },
      { allowInherit: false },
    ),
  );
  assert.deepEqual(
    validateCommercialTerms({ mode: "inherit" }, { allowInherit: true }),
    { mode: "inherit" },
  );
});

test("rechaza vigencias invertidas", () => {
  assert.throws(() =>
    validateCommercialTerms(
      { mode: "purchase", effectiveFrom: "fecha inválida" },
      { allowInherit: false },
    ),
  );
  assert.throws(() =>
    validateCommercialTerms(
      {
        mode: "purchase",
        effectiveFrom: "2026-10-02T00:00:00.000Z",
        effectiveTo: "2026-10-01T00:00:00.000Z",
      },
      { allowInherit: false },
    ),
  );
});

test("las revisiones contractuales exigen alcance, aprobación y cierre auditables", () => {
  assert.equal(
    typeof commercialAgreementModule.validateAgreementLifecycle,
    "function",
  );
  const validate = commercialAgreementModule.validateAgreementLifecycle;
  const draft = {
    supplier: 9,
    revision: 1,
    status: "draft",
    terms: { mode: "purchase" },
  };
  assert.deepEqual(validate(draft), draft);
  assert.throws(() => validate({ ...draft, revision: 0 }));
  assert.throws(() =>
    validate({ ...draft, revision: 2, previousAgreement: null }),
  );
  assert.throws(() => validate({ ...draft, variant: 4, product: null }));
  assert.throws(() =>
    validate({
      ...draft,
      status: "active",
      approvedBy: null,
      approvedAt: null,
    }),
  );
  assert.throws(() =>
    validate({
      ...draft,
      status: "active",
      approvedBy: 3,
      approvedAt: "2026-10-11T12:00:00.000Z",
    }),
  );
  assert.throws(() =>
    validate({
      ...draft,
      status: "terminated",
      approvedBy: 3,
      approvedAt: "2026-10-11T12:00:00.000Z",
      terminationReason: "",
      terminatedAt: null,
    }),
  );
});

test("solo finanzas aprueba y una revisión activa no reescribe sus términos", () => {
  assert.equal(
    typeof commercialAgreementModule.applyAgreementTransition,
    "function",
  );
  const transition = commercialAgreementModule.applyAgreementTransition;
  const draft = {
    supplier: 9,
    revision: 1,
    status: "draft",
    terms: { mode: "purchase", effectiveFrom: "2026-10-11T00:00:00.000Z" },
  };
  assert.throws(() =>
    transition({
      original: draft,
      data: { status: "active" },
      user: { id: 2, roles: ["purchasing"] },
      now: "2026-10-11T12:00:00.000Z",
    }),
  );
  const active = transition({
    original: draft,
    data: { status: "active" },
    user: { id: 3, roles: ["finance"] },
    now: "2026-10-11T12:00:00.000Z",
  });
  assert.equal(active.status, "active");
  assert.equal(active.approvedBy, 3);
  assert.equal(active.approvedAt, "2026-10-11T12:00:00.000Z");
  assert.doesNotThrow(() =>
    transition({
      original: { ...active, supplier: { id: 9 } },
      data: { supplier: 9 },
      user: { id: 3, roles: ["finance"] },
      now: "2026-10-12T12:00:00.000Z",
    }),
  );
  assert.throws(() =>
    transition({
      original: { ...active, reference: "ACUERDO-001" },
      data: { reference: "ACUERDO-RENOMBRADO" },
      user: { id: 3, roles: ["finance"] },
      now: "2026-10-12T12:00:00.000Z",
    }),
  );
  assert.throws(() =>
    transition({
      original: active,
      data: {
        terms: {
          mode: "consignment",
          method: "fixed",
          fixedMinor: 1000,
          currency: "ARS",
        },
      },
      user: { id: 3, roles: ["finance"] },
      now: "2026-10-12T12:00:00.000Z",
    }),
  );
  assert.throws(() =>
    transition({
      original: active,
      data: { status: "draft" },
      user: { id: 1, roles: ["admin"] },
      now: "2026-10-12T12:00:00.000Z",
    }),
  );
  const terminated = transition({
    original: active,
    data: { status: "terminated", terminationReason: "Fin del contrato" },
    user: { id: 1, roles: ["admin"] },
    now: "2026-10-12T12:00:00.000Z",
  });
  assert.equal(terminated.terminatedAt, "2026-10-12T12:00:00.000Z");
  assert.equal(terminated.terms.effectiveTo, "2026-10-12T12:00:00.000Z");
  assert.throws(() =>
    transition({
      original: terminated,
      data: { supplier: 10 },
      user: { id: 1, roles: ["admin"] },
      now: "2026-10-13T12:00:00.000Z",
    }),
  );
});

test("las vigencias abiertas se solapan pero los períodos adyacentes no", () => {
  assert.equal(
    typeof commercialAgreementModule.agreementPeriodsOverlap,
    "function",
  );
  const overlaps = commercialAgreementModule.agreementPeriodsOverlap;
  assert.equal(overlaps({}, {}), true);
  assert.equal(
    overlaps(
      {
        effectiveFrom: "2026-01-01T00:00:00.000Z",
        effectiveTo: "2026-06-01T00:00:00.000Z",
      },
      {
        effectiveFrom: "2026-05-01T00:00:00.000Z",
        effectiveTo: "2026-08-01T00:00:00.000Z",
      },
    ),
    true,
  );
  assert.equal(
    overlaps(
      {
        effectiveFrom: "2026-01-01T00:00:00.000Z",
        effectiveTo: "2026-06-01T00:00:00.000Z",
      },
      { effectiveFrom: "2026-06-01T00:00:00.000Z" },
    ),
    false,
  );
});

test("el costo privado exige importe menor entero, moneda, base y fecha válidos", () => {
  const valid = {
    supplier: 9,
    purchaseCost: {
      amountMinor: 125050,
      currency: "BRL",
      baseQuantity: 1,
      baseUnit: "unidad",
      updatedAt: "2026-09-25T00:00:00.000Z",
    },
    termsOverride: { mode: "inherit" },
  };
  assert.deepEqual(validatePurchasingData({ data: valid }), valid);
  for (const purchaseCost of [
    { ...valid.purchaseCost, amountMinor: 1.5 },
    { ...valid.purchaseCost, currency: "brl" },
    { ...valid.purchaseCost, baseQuantity: 0 },
    { ...valid.purchaseCost, baseUnit: "" },
    { ...valid.purchaseCost, updatedAt: "ayer" },
  ]) {
    assert.throws(() =>
      validatePurchasingData({ data: { ...valid, purchaseCost } }),
    );
  }
  assert.throws(() =>
    validatePurchasingData({ data: { ...valid, supplier: null } }),
  );
});

test("un costo sin fecha devuelve un error de campo útil al publicar", () => {
  assert.throws(
    () =>
      validatePurchasingData({
        data: {
          _status: "published",
          supplier: 1,
          purchaseCost: {
            amountMinor: 500,
            currency: "BRL",
            baseQuantity: 1,
            baseUnit: "g",
            updatedAt: null,
          },
          termsOverride: { mode: "inherit" },
        },
      }),
    (error) => {
      assert.equal(error.name, "ValidationError");
      assert.deepEqual(error.data.errors, [
        {
          path: "purchaseCost.updatedAt",
          message: "Indicá una fecha válida de actualización del costo.",
        },
      ]);
      return true;
    },
  );
});

test("una actualización parcial conserva y valida los datos privados existentes", () => {
  const originalDoc = {
    supplier: 9,
    purchaseCost: {
      amountMinor: 10000,
      currency: "ARS",
      baseQuantity: 1,
      baseUnit: "unidad",
      updatedAt: "2026-09-25T00:00:00.000Z",
    },
    termsOverride: { mode: "inherit" },
  };
  const result = validatePurchasingData({
    data: { title: "Cambio editorial" },
    originalDoc,
  });
  assert.deepEqual(result, { title: "Cambio editorial" });
  assert.throws(() =>
    validatePurchasingData({ data: { supplier: null }, originalDoc }),
  );
});

test("la excepción vigente prevalece y la herencia usa el acuerdo del proveedor", () => {
  const supplier = {
    mode: "consignment",
    method: "percentage",
    shareBps: 3000,
    percentageBasis: {
      productDiscounts: "deduct",
      orderDiscounts: "deduct_allocated",
      taxes: "exclude",
      shipping: "exclude",
      tipsDonations: "exclude",
      paymentFees: "store_absorbs",
    },
    effectiveFrom: "2026-01-01T00:00:00.000Z",
  };
  assert.deepEqual(
    resolveEffectiveCommercialTerms(
      { mode: "inherit" },
      supplier,
      "2026-09-25T00:00:00.000Z",
    ),
    { source: "supplier", terms: supplier },
  );
  const override = {
    mode: "consignment",
    method: "fixed",
    fixedMinor: 25000,
    currency: "ARS",
    effectiveTo: "2026-12-31T00:00:00.000Z",
  };
  assert.deepEqual(
    resolveEffectiveCommercialTerms(
      override,
      supplier,
      "2026-09-25T00:00:00.000Z",
    ),
    { source: "product", terms: override },
  );
  assert.throws(() =>
    resolveEffectiveCommercialTerms(
      { ...override, effectiveTo: "2026-01-02T00:00:00.000Z" },
      supplier,
      "2026-09-25T00:00:00.000Z",
    ),
  );
});

test("la proyección pública no serializa proveedor, costo ni acuerdo", () => {
  const product = mapProduct({
    id: 1,
    slug: "cacao",
    title: "Cacao",
    _status: "published",
    enableVariants: false,
    inventory: 1,
    priceInARSEnabled: true,
    priceInARS: 10000,
    supplier: { id: 9, name: "Proveedor secreto" },
    supplierSKU: "PRIVADO-1",
    purchaseCost: { amountMinor: 5000, currency: "ARS" },
    termsOverride: {
      mode: "consignment",
      method: "percentage",
      shareBps: 4000,
      percentageBasis: {
        productDiscounts: "deduct",
        orderDiscounts: "deduct_allocated",
        taxes: "exclude",
        shipping: "exclude",
        tipsDonations: "exclude",
        paymentFees: "store_absorbs",
      },
    },
    purchasingNotes: "No publicar",
  });
  const serialized = JSON.stringify(product);
  for (const privateValue of [
    "Proveedor secreto",
    "PRIVADO-1",
    "purchaseCost",
    "shareBps",
    "No publicar",
  ]) {
    assert.equal(serialized.includes(privateValue), false);
  }
});
