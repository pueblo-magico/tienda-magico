import assert from "node:assert/strict";
import { test } from "node:test";

import { Suppliers } from "../apps/cms/src/collections/Suppliers.ts";
import { Users } from "../apps/cms/src/collections/Users.ts";
import {
  purchasingFields,
  resolveEffectiveCommercialTerms,
  validateCommercialTerms,
  validatePurchasingData,
} from "../apps/cms/src/collections/commercialAgreements.ts";
import { mapProduct } from "@/lib/commerce/providers/payload-ecommerce/mappers";

process.env.PAYLOAD_ECOMMERCE_URL = "http://cms.test";
process.env.PAYLOAD_ECOMMERCE_CURRENCY = "ARS";
process.env.PAYLOAD_ECOMMERCE_AMOUNT_IS_CENTS = "true";

const namedField = (fields, name) =>
  fields.find((field) => "name" in field && field.name === name);

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

test("usuarios admite roles privados de compras y finanzas", () => {
  const roles = namedField(Users.fields, "roles");
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
        field.access[operation]({ req: { user: { roles: ["purchasing"] } } }),
        true,
      );
    }
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
      },
      { allowInherit: false },
    ),
    {
      mode: "consignment",
      method: "percentage",
      shareBps: 3500,
    },
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
      {
        mode: "purchase",
        effectiveFrom: "2026-10-02T00:00:00.000Z",
        effectiveTo: "2026-10-01T00:00:00.000Z",
      },
      { allowInherit: false },
    ),
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
