import assert from "node:assert/strict";
import { test } from "node:test";

import { Suppliers } from "../apps/cms/src/collections/Suppliers.ts";
import { Users } from "../apps/cms/src/collections/Users.ts";
import {
  purchasingFields,
  validateCommercialTerms,
} from "../apps/cms/src/collections/commercialAgreements.ts";

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
    if (!("access" in field) || !field.access?.read) continue;
    assert.equal(field.access.read({ req: {} }), false);
    assert.equal(
      field.access.read({ req: { user: { roles: ["customer"] } } }),
      false,
    );
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
