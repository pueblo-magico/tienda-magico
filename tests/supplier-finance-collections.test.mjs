import assert from "node:assert/strict";
import test from "node:test";

import { SupplierPaymentProfiles } from "../apps/cms/src/collections/SupplierPaymentProfiles.ts";
import { SupplierObligations } from "../apps/cms/src/collections/SupplierObligations.ts";
import { SupplierPayouts } from "../apps/cms/src/collections/SupplierPayouts.ts";
import { SupplierSettlements } from "../apps/cms/src/collections/SupplierSettlements.ts";
import { ordersCollectionOverride } from "../apps/cms/src/collections/orderCommercialSnapshot.ts";
import { supplierPayoutConfirmationInput } from "../apps/cms/src/utilities/confirmSupplierPayout.ts";
import { createSupplierObligationsForPaidOrder } from "../apps/cms/src/utilities/createSupplierObligationsForPaidOrder.ts";

const namedField = (collection, name) =>
  collection.fields.find((field) => field.name === name);

test("los perfiles y movimientos financieros son privados y separados del catalogo", () => {
  for (const collection of [
    SupplierPaymentProfiles,
    SupplierObligations,
    SupplierSettlements,
    SupplierPayouts,
  ]) {
    assert.equal(collection.admin.group.es, "Finanzas");
    assert.equal(collection.access.read({ req: {} }), false);
    assert.equal(collection.access.create({ req: {} }), false);
  }
  assert.equal(
    namedField(SupplierPaymentProfiles, "supplier").relationTo,
    "suppliers",
  );
  assert.equal(
    namedField(SupplierSettlements, "supplier").relationTo,
    "suppliers",
  );
  assert.equal(
    namedField(SupplierPayouts, "settlement").relationTo,
    "supplier-settlements",
  );
});

test("la transición de un pedido a pago aprobado dispara obligaciones idempotentes", () => {
  const collection = ordersCollectionOverride({
    defaultCollection: { fields: [], slug: "orders" },
  });
  const hooks = collection.hooks?.afterChange ?? [];
  assert.equal(
    hooks.some((hook) => hook.name === "createSupplierObligationsForPaidOrder"),
    true,
  );
  assert.equal(namedField(SupplierObligations, "sourceKey").unique, true);
  assert.equal(SupplierObligations.access.create({ req: {} }), false);
  assert.equal(SupplierObligations.access.delete({ req: {} }), false);
});

test("el hook persiste una sola obligación consignada con snapshot contractual", async () => {
  const obligations = [];
  const req = {
    payload: {
      find: async ({ collection, where }) => {
        if (collection === "supplier-obligations") {
          const sourceKey = where.sourceKey.equals;
          return {
            docs: obligations.filter((doc) => doc.sourceKey === sourceKey),
          };
        }
        if (collection === "supplier-agreements") {
          return {
            docs: [
              {
                id: 9,
                reference: "AC-9",
                supplier: 3,
                product: 2,
                revision: 4,
                status: "active",
                terms: {
                  mode: "consignment",
                  method: "percentage",
                  shareBps: 3500,
                  currency: "ARS",
                  effectiveFrom: "2026-01-01T00:00:00.000Z",
                  percentageBasis: {
                    productDiscounts: "deduct",
                    orderDiscounts: "deduct_allocated",
                    taxes: "exclude",
                    shipping: "exclude",
                    tipsDonations: "exclude",
                    paymentFees: "store_absorbs",
                  },
                },
              },
            ],
          };
        }
        throw new Error(`unexpected collection ${collection}`);
      },
      findByID: async ({ collection }) => {
        assert.equal(collection, "products");
        return { id: 2, supplier: 3 };
      },
      create: async ({ collection, data }) => {
        assert.equal(collection, "supplier-obligations");
        obligations.push(data);
        return data;
      },
    },
  };
  const args = {
    doc: {
      id: 7,
      paymentStatus: "approved",
      items: [{ product: 2, quantity: 1 }],
      commercialSnapshot: {
        items: [
          {
            productId: "2",
            merchandiseId: "product:2",
            sku: "SKU-2",
            quantity: 1,
            total: { amount: "100.00", currencyCode: "ARS" },
          },
        ],
      },
    },
    previousDoc: { paymentStatus: "pending" },
    req,
  };
  await createSupplierObligationsForPaidOrder(args);
  await createSupplierObligationsForPaidOrder(args);
  assert.equal(obligations.length, 1);
  assert.equal(obligations[0].sourceKey, "order:7:line:0");
  assert.equal(obligations[0].status, "eligible");
  assert.equal(obligations[0].supplierAmountMinor, 3500);
  assert.equal(obligations[0].snapshot.agreement.revision, 4);
});

test("los importes e identidad externa no se pueden cambiar desde la API", () => {
  for (const field of [
    "supplier",
    "settlement",
    "paymentProfile",
    "amountMinor",
    "currency",
  ]) {
    assert.equal(namedField(SupplierPayouts, field).access.update(), false);
  }
  for (const field of [
    "status",
    "idempotencyKey",
    "providerPayoutId",
    "providerTransactionId",
    "confirmedBy",
    "confirmedAt",
  ]) {
    const config = namedField(SupplierPayouts, field);
    assert.equal(config.access.create(), false);
    assert.equal(config.access.update(), false);
  }
});

test("la confirmacion exige aceptación explicita sin aceptar campos adicionales", () => {
  assert.deepEqual(supplierPayoutConfirmationInput({ acknowledged: true }), {
    acknowledged: true,
  });
  assert.throws(() => supplierPayoutConfirmationInput({ acknowledged: false }));
  assert.throws(() =>
    supplierPayoutConfirmationInput({ acknowledged: true, amount: 1 }),
  );
});

test("la acción de pago queda disponible solo desde un payout persistido", () => {
  const confirmation = namedField(SupplierPayouts, "confirmPayout");
  assert.equal(confirmation.type, "ui");
  assert.match(confirmation.admin.components.Field, /ConfirmSupplierPayout/);
  assert.equal(
    SupplierPayouts.endpoints.some(
      (endpoint) => endpoint.path === "/:id/confirm",
    ),
    true,
  );
  const reconciliation = namedField(SupplierPayouts, "reconcilePayout");
  assert.equal(reconciliation.type, "ui");
  assert.match(
    reconciliation.admin.components.Field,
    /ReconcileSupplierPayout/,
  );
  assert.equal(
    SupplierPayouts.endpoints.some(
      (endpoint) => endpoint.path === "/:id/reconcile",
    ),
    true,
  );
});
