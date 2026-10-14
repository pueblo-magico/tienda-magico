import assert from "node:assert/strict";
import test from "node:test";

import { SupplierPaymentProfiles } from "../apps/cms/src/collections/SupplierPaymentProfiles.ts";
import { SupplierFinanceEvents } from "../apps/cms/src/collections/SupplierFinanceEvents.ts";
import { SupplierPayoutPolicyEvents } from "../apps/cms/src/collections/SupplierPayoutPolicyEvents.ts";
import { SupplierObligations } from "../apps/cms/src/collections/SupplierObligations.ts";
import { SupplierPayouts } from "../apps/cms/src/collections/SupplierPayouts.ts";
import { SupplierSettlements } from "../apps/cms/src/collections/SupplierSettlements.ts";
import { ordersCollectionOverride } from "../apps/cms/src/collections/orderCommercialSnapshot.ts";
import {
  confirmSupplierPayout,
  supplierPayoutConfirmationInput,
} from "../apps/cms/src/utilities/confirmSupplierPayout.ts";
import { createSupplierObligationsForPaidOrder } from "../apps/cms/src/utilities/createSupplierObligationsForPaidOrder.ts";
import { manualSupplierPayoutInput } from "../apps/cms/src/utilities/recordManualSupplierPayout.ts";
import { reconcileSupplierPayout } from "../apps/cms/src/utilities/reconcileSupplierPayout.ts";
import { appendSupplierFinanceEvent } from "../apps/cms/src/utilities/appendSupplierFinanceEvent.ts";
import { SupplierPayoutPolicy } from "../apps/cms/src/globals/SupplierPayoutPolicy.ts";
import {
  appendSupplierPayoutPolicyEvent,
  validateSupplierPayoutPolicy,
} from "../apps/cms/src/utilities/supplierPayoutPolicy.ts";

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
    SupplierSettlements.access.create({ req: { user: { roles: ["admin"] } } }),
    false,
  );
  assert.equal(
    namedField(SupplierPayouts, "settlement").relationTo,
    "supplier-settlements",
  );
  assert.notEqual(namedField(SupplierPayouts, "settlement").unique, true);
});

test("los eventos financieros son anexos, privados y exportables para contabilidad", () => {
  assert.equal(SupplierFinanceEvents.slug, "supplier-finance-events");
  assert.equal(SupplierFinanceEvents.access.read({ req: {} }), false);
  assert.equal(
    SupplierFinanceEvents.access.read({
      req: { user: { roles: ["finance"] } },
    }),
    true,
  );
  assert.equal(SupplierFinanceEvents.access.create({ req: {} }), false);
  assert.equal(SupplierFinanceEvents.access.update({ req: {} }), false);
  assert.equal(SupplierFinanceEvents.access.delete({ req: {} }), false);
  assert.equal(namedField(SupplierFinanceEvents, "eventKey").unique, true);
  assert.equal(
    namedField(SupplierFinanceEvents, "payout").relationTo,
    "supplier-payouts",
  );
  assert.equal(
    namedField(SupplierFinanceEvents, "settlement").relationTo,
    "supplier-settlements",
  );
  for (const field of [
    "eventType",
    "provider",
    "amountMinor",
    "appliedMinor",
    "outstandingAfterMinor",
    "feeMinor",
    "feeResponsibility",
    "occurredAt",
    "actor",
  ]) {
    assert.ok(
      namedField(SupplierFinanceEvents, field),
      `Falta el campo contable ${field}`,
    );
  }
});

test("la política de pagos queda cerrada por defecto y solo administración puede cambiarla", () => {
  assert.equal(SupplierPayoutPolicy.slug, "supplier-payout-policy");
  assert.equal(SupplierPayoutPolicy.access.read({ req: {} }), false);
  assert.equal(
    SupplierPayoutPolicy.access.update({
      req: { user: { roles: ["finance"] } },
    }),
    false,
  );
  assert.equal(
    SupplierPayoutPolicy.access.update({
      req: { user: { roles: ["admin"] } },
    }),
    true,
  );
  assert.equal(
    namedField(SupplierPayoutPolicy, "emergencyStop").defaultValue,
    true,
  );
  assert.equal(
    namedField(SupplierPayoutPolicy, "outboundProviderPaymentsEnabled")
      .defaultValue,
    false,
  );
  assert.equal(
    namedField(SupplierPayoutPolicy, "automaticProviderPaymentsEnabled")
      .defaultValue,
    false,
  );
  assert.throws(() =>
    validateSupplierPayoutPolicy({
      data: {
        emergencyStop: true,
        outboundProviderPaymentsEnabled: true,
        automaticProviderPaymentsEnabled: true,
      },
      originalDoc: {},
    }),
  );
});

test("los cambios de política generan un historial privado, inmutable e idempotente", async () => {
  assert.equal(SupplierPayoutPolicyEvents.access.read({ req: {} }), false);
  assert.equal(
    SupplierPayoutPolicyEvents.access.read({
      req: { user: { roles: ["finance"] } },
    }),
    true,
  );
  assert.equal(SupplierPayoutPolicyEvents.access.create({ req: {} }), false);
  assert.equal(SupplierPayoutPolicyEvents.access.update({ req: {} }), false);
  assert.equal(SupplierPayoutPolicyEvents.access.delete({ req: {} }), false);
  assert.equal(namedField(SupplierPayoutPolicyEvents, "eventKey").unique, true);

  const events = [];
  const req = {
    user: { id: 9 },
    payload: {
      find: async ({ collection, where }) => {
        assert.equal(collection, "supplier-payout-policy-events");
        return {
          docs: events.filter(
            (event) => event.eventKey === where.eventKey.equals,
          ),
        };
      },
      create: async ({ collection, data, overrideAccess }) => {
        assert.equal(collection, "supplier-payout-policy-events");
        assert.equal(overrideAccess, true);
        events.push(data);
        return data;
      },
    },
  };
  const args = {
    doc: {
      emergencyStop: false,
      outboundProviderPaymentsEnabled: true,
      automaticProviderPaymentsEnabled: false,
      updatedAt: "2026-10-13T15:00:00.000Z",
    },
    previousDoc: {
      emergencyStop: true,
      outboundProviderPaymentsEnabled: false,
      automaticProviderPaymentsEnabled: false,
    },
    req,
  };

  await appendSupplierPayoutPolicyEvent(args);
  await appendSupplierPayoutPolicyEvent(args);

  assert.equal(events.length, 1);
  assert.equal(events[0].actor, 9);
  assert.equal(events[0].previousEmergencyStop, true);
  assert.equal(events[0].emergencyStop, false);
  assert.equal(events[0].outboundProviderPaymentsEnabled, true);
});

test("la escritura de eventos es idempotente y limita los datos a campos contables", async () => {
  const events = [];
  const req = {
    payload: {
      find: async ({ collection, where }) => {
        assert.equal(collection, "supplier-finance-events");
        return {
          docs: events.filter(
            (event) => event.eventKey === where.eventKey.equals,
          ),
        };
      },
      create: async ({ collection, data, overrideAccess }) => {
        assert.equal(collection, "supplier-finance-events");
        assert.equal(overrideAccess, true);
        events.push(data);
        return data;
      },
    },
  };
  const input = {
    eventKey: "manual:17:TRX-9182",
    eventType: "partial_payment",
    supplier: 3,
    settlement: 5,
    payout: 17,
    provider: "manual",
    amountMinor: 25_000,
    appliedMinor: 25_000,
    outstandingAfterMinor: 25_000,
    feeMinor: 0,
    feeResponsibility: "unknown",
    currency: "ARS",
    previousStatus: "awaiting_approval",
    nextStatus: "succeeded",
    actor: 9,
    occurredAt: "2026-10-13T12:00:00.000Z",
    correlationKey: "payout:17",
    externalReference: "TRX-9182",
    accessToken: "no-debe-persistirse",
  };

  await appendSupplierFinanceEvent(req, input);
  await appendSupplierFinanceEvent(req, input);

  assert.equal(events.length, 1);
  assert.equal(events[0].eventKey, input.eventKey);
  assert.equal(events[0].amountMinor, 25_000);
  assert.equal(events[0].accessToken, undefined);
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

test("el hook agrupa obligaciones consignadas en una sola liquidación idempotente", async () => {
  const obligations = [];
  const settlements = [];
  const req = {
    payload: {
      find: async ({ collection, where }) => {
        if (collection === "supplier-obligations") {
          const sourceKey = where.sourceKey.equals;
          return {
            docs: obligations.filter((doc) => doc.sourceKey === sourceKey),
          };
        }
        if (collection === "supplier-settlements") {
          const reference = where.reference.equals;
          return {
            docs: settlements.filter((doc) => doc.reference === reference),
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
        if (collection === "supplier-obligations") {
          const obligation = { id: obligations.length + 1, ...data };
          obligations.push(obligation);
          return obligation;
        }
        if (collection === "supplier-settlements") {
          const settlement = { id: settlements.length + 1, ...data };
          settlements.push(settlement);
          return settlement;
        }
        throw new Error(`unexpected collection ${collection}`);
      },
      update: async ({ collection, id, data }) => {
        assert.equal(collection, "supplier-obligations");
        const obligation = obligations.find((doc) => doc.id === id);
        Object.assign(obligation, data);
        return obligation;
      },
    },
  };
  const args = {
    doc: {
      id: 7,
      paymentStatus: "approved",
      items: [
        { product: 2, quantity: 1 },
        { product: 2, quantity: 1 },
      ],
      commercialSnapshot: {
        items: [
          {
            productId: "2",
            merchandiseId: "product:2",
            sku: "SKU-2",
            quantity: 1,
            total: { amount: "100.00", currencyCode: "ARS" },
          },
          {
            productId: "2",
            merchandiseId: "product:2",
            sku: "SKU-2",
            quantity: 1,
            total: { amount: "50.00", currencyCode: "ARS" },
          },
        ],
      },
    },
    previousDoc: { paymentStatus: "pending" },
    req,
  };
  await createSupplierObligationsForPaidOrder(args);
  await createSupplierObligationsForPaidOrder(args);
  assert.equal(obligations.length, 2);
  assert.equal(obligations[0].sourceKey, "order:7:line:0");
  assert.equal(obligations[1].sourceKey, "order:7:line:1");
  assert.equal(obligations[0].status, "eligible");
  assert.equal(obligations[0].supplierAmountMinor, 3500);
  assert.equal(obligations[1].supplierAmountMinor, 1750);
  assert.equal(obligations[0].snapshot.agreement.revision, 4);
  assert.equal(settlements.length, 1);
  assert.deepEqual(settlements[0], {
    id: 1,
    reference: "AUTO-ORD-7-PROV-3-ARS",
    supplier: 3,
    currency: "ARS",
    amountMinor: 5250,
    outstandingMinor: 5250,
    status: "draft",
  });
  assert.equal(obligations[0].settlement, 1);
  assert.equal(obligations[1].settlement, 1);
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

test("la confirmación consulta la política persistida y no llega al proveedor si está bloqueada", async () => {
  let committed = false;
  let rolledBack = false;
  const transaction = { execute: async () => ({ rows: [] }) };
  const req = {
    user: { id: 9, roles: ["admin"] },
    payload: {
      db: {
        name: "postgres",
        sessions: { tx: { db: transaction } },
        beginTransaction: async () => "tx",
        commitTransaction: async () => {
          committed = true;
        },
        rollbackTransaction: async () => {
          rolledBack = true;
        },
      },
      findByID: async ({ collection }) => {
        if (collection === "users") return { id: 9, roles: ["admin"] };
        if (collection === "supplier-payouts")
          return {
            id: 17,
            status: "awaiting_approval",
            settlement: 5,
            paymentProfile: 8,
            supplier: 3,
            amountMinor: 50_000,
          };
        if (collection === "supplier-settlements")
          return {
            id: 5,
            supplier: 3,
            status: "approved",
            currency: "ARS",
            outstandingMinor: 50_000,
          };
        if (collection === "supplier-payment-profiles")
          return {
            id: 8,
            supplier: 3,
            status: "verified",
            currency: "ARS",
          };
        throw new Error(`Colección inesperada: ${collection}`);
      },
      findGlobal: async ({ slug, overrideAccess }) => {
        assert.equal(slug, "supplier-payout-policy");
        assert.equal(overrideAccess, true);
        return {
          emergencyStop: true,
          outboundProviderPaymentsEnabled: false,
          automaticProviderPaymentsEnabled: false,
        };
      },
      logger: {
        error: () => assert.fail("No debe registrarse un error interno"),
      },
    },
  };

  const response = await confirmSupplierPayout(req, 17);

  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), { code: "emergency_stop" });
  assert.equal(rolledBack, true);
  assert.equal(committed, false);
});

test("la confirmación resuelve el proveedor verificado sin aceptar una selección del cliente", async () => {
  const updates = [];
  const events = [];
  const submissions = [];
  let resolvedProvider;
  const transaction = { execute: async () => ({ rows: [] }) };
  const req = {
    user: { id: 9, roles: ["admin"] },
    payload: {
      db: {
        name: "postgres",
        sessions: { tx: { db: transaction } },
        beginTransaction: async () => "tx",
        commitTransaction: async () => {},
        rollbackTransaction: async () => assert.fail("No debe revertir"),
      },
      findByID: async ({ collection }) => {
        if (collection === "users") return { id: 9, roles: ["admin"] };
        if (collection === "supplier-payouts")
          return {
            id: 17,
            status: "awaiting_approval",
            settlement: 5,
            paymentProfile: 8,
            supplier: 3,
            amountMinor: 50_000,
            idempotencyKey: "018f47bd-4c30-7d2a-a58e-93784f3123e1",
          };
        if (collection === "supplier-settlements")
          return {
            id: 5,
            supplier: 3,
            status: "approved",
            currency: "ARS",
            outstandingMinor: 50_000,
          };
        if (collection === "supplier-payment-profiles")
          return {
            id: 8,
            supplier: 3,
            provider: "mercado-pago",
            recipientEmail: "proveedor@example.test",
            status: "verified",
            currency: "ARS",
            verifiedAt: "2026-10-14T12:00:00.000Z",
          };
        throw new Error(`Colección inesperada: ${collection}`);
      },
      findGlobal: async () => ({
        emergencyStop: false,
        outboundProviderPaymentsEnabled: true,
        automaticProviderPaymentsEnabled: false,
      }),
      find: async () => ({ docs: [] }),
      create: async ({ data }) => events.push(data),
      update: async (operation) => updates.push(operation),
      logger: { error: () => assert.fail("No debe registrar un error") },
    },
  };
  const provider = {
    id: "mercado-pago",
    capabilities: {
      submit: true,
      queryStatus: true,
      notifications: true,
      cancel: false,
    },
    validateRecipient: () => {},
    submit: async (request) => {
      submissions.push(request);
      return {
        provider: "mercado-pago",
        payoutID: "POP123",
        transactionID: "TOP123",
        status: "submitted",
        providerStatus: "created",
      };
    },
    getStatus: async () => assert.fail("No debe consultar el estado"),
  };

  const response = await confirmSupplierPayout(req, 17, (providerID) => {
    resolvedProvider = providerID;
    return provider;
  });

  assert.equal(response.status, 200);
  assert.equal(resolvedProvider, "mercado-pago");
  assert.equal(submissions.length, 1);
  assert.deepEqual(submissions[0].recipient, {
    kind: "email",
    value: "proveedor@example.test",
  });
  assert.equal(
    submissions[0].idempotencyKey,
    "018f47bd-4c30-7d2a-a58e-93784f3123e1",
  );
  assert.equal(
    updates.some(
      ({ collection, data }) =>
        collection === "supplier-payouts" &&
        data.providerTransactionId === "TOP123",
    ),
    true,
  );
  assert.equal(
    events.some(({ eventType }) => eventType === "submitted"),
    true,
  );
});

test("la conciliación usa el proveedor persistido y sus referencias externas", async () => {
  const updates = [];
  const events = [];
  let resolvedProvider;
  let statusInput;
  const transaction = { execute: async () => ({ rows: [] }) };
  const req = {
    user: { id: 9, roles: ["admin"] },
    payload: {
      db: {
        name: "postgres",
        sessions: { tx: { db: transaction } },
        beginTransaction: async () => "tx",
        commitTransaction: async () => {},
        rollbackTransaction: async () => assert.fail("No debe revertir"),
      },
      findByID: async ({ collection }) => {
        if (collection === "users") return { id: 9, roles: ["admin"] };
        if (collection === "supplier-payouts")
          return {
            id: 17,
            status: "submitted",
            settlement: 5,
            supplier: 3,
            amountMinor: 50_000,
            paymentMethod: "mercado-pago",
            providerPayoutId: "POP123",
            providerTransactionId: "TOP123",
          };
        if (collection === "supplier-settlements")
          return {
            id: 5,
            status: "payment_pending",
            amountMinor: 50_000,
            outstandingMinor: 50_000,
          };
        throw new Error(`Colección inesperada: ${collection}`);
      },
      find: async () => ({ docs: [] }),
      create: async ({ data }) => events.push(data),
      update: async (operation) => updates.push(operation),
      logger: { error: () => assert.fail("No debe registrar un error") },
    },
  };
  const provider = {
    id: "mercado-pago",
    capabilities: {
      submit: true,
      queryStatus: true,
      notifications: true,
      cancel: false,
    },
    validateRecipient: () => {},
    submit: async () => assert.fail("No debe reenviar el pago"),
    getStatus: async (input) => {
      statusInput = input;
      return {
        status: "processing",
        providerStatus: "approved",
        providerStatusDetail: null,
      };
    },
  };

  const response = await reconcileSupplierPayout(req, 17, (providerID) => {
    resolvedProvider = providerID;
    return provider;
  });

  assert.equal(response.status, 200);
  assert.equal(resolvedProvider, "mercado-pago");
  assert.deepEqual(statusInput, {
    payoutID: "POP123",
    transactionID: "TOP123",
  });
  assert.equal(
    updates.some(
      ({ collection, data }) =>
        collection === "supplier-payouts" && data.status === "processing",
    ),
    true,
  );
  assert.equal(
    events.some(({ eventType }) => eventType === "provider_status_checked"),
    true,
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

test("el payout persistido admite una conciliación manual explícita y auditable", () => {
  const manualAction = namedField(SupplierPayouts, "recordManualPayout");
  assert.equal(manualAction.type, "ui");
  assert.match(
    manualAction.admin.components.Field,
    /RecordManualSupplierPayout/,
  );
  assert.equal(
    SupplierPayouts.endpoints.some(
      (endpoint) => endpoint.path === "/:id/record-manual",
    ),
    true,
  );

  for (const field of [
    "paymentMethod",
    "manualReference",
    "manualPaidAt",
    "manualRecordedBy",
  ]) {
    const config = namedField(SupplierPayouts, field);
    assert.ok(config, `Falta el campo auditable ${field}`);
    assert.equal(config.access.create(), false);
    assert.equal(config.access.update(), false);
  }
  assert.equal(namedField(SupplierPayouts, "manualReference").unique, true);

  assert.deepEqual(
    manualSupplierPayoutInput({
      acknowledged: true,
      reference: "  TRX-9182  ",
      paidAt: "2026-10-12T15:30:00.000Z",
      amountMinor: 25_000,
    }),
    {
      acknowledged: true,
      reference: "TRX-9182",
      paidAt: "2026-10-12T15:30:00.000Z",
      amountMinor: 25_000,
    },
  );
  assert.throws(() =>
    manualSupplierPayoutInput({
      acknowledged: true,
      reference: "TRX-9182",
      paidAt: "2026-10-12T15:30:00.000Z",
      amountMinor: 25_000,
      amount: 1,
    }),
  );
  assert.throws(() =>
    manualSupplierPayoutInput({
      acknowledged: true,
      reference: "TRX-9182",
      paidAt: "2026-10-12T15:30:00.000Z",
      amountMinor: 25_000.5,
    }),
  );
});
