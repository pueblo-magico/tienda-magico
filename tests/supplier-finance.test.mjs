import assert from "node:assert/strict";
import test from "node:test";

import {
  PayoutConfirmationError,
  assertPayoutConfirmation,
  calculateSupplierObligation,
} from "../apps/cms/src/lib/supplierFinance/policy.ts";
import * as supplierFinancePolicy from "../apps/cms/src/lib/supplierFinance/policy.ts";
import {
  buildMercadoPagoPayoutBody,
  getMercadoPagoPayoutStatus,
  submitMercadoPagoPayout,
} from "../apps/cms/src/lib/supplierFinance/mercadoPagoPayouts.ts";
import {
  deriveSupplierObligation,
  moneyStringToMinor,
} from "../apps/cms/src/lib/supplierFinance/orderObligations.ts";

test("una compra no genera deuda por cada venta", () => {
  assert.deepEqual(
    calculateSupplierObligation({
      mode: "purchase",
      saleCurrency: "ARS",
      eligibleBaseMinor: 10_000,
      quantity: 1,
    }),
    { kind: "none", reason: "purchase" },
  );
});

test("la consignacion calcula porcentaje y parte contractual sin punto flotante", () => {
  assert.deepEqual(
    calculateSupplierObligation({
      mode: "consignment",
      method: "percentage",
      shareBps: 3500,
      agreementCurrency: "ARS",
      saleCurrency: "ARS",
      eligibleBaseMinor: 12_345,
      quantity: 1,
    }),
    { kind: "obligation", supplierAmountMinor: 4321, storeAmountMinor: 8024 },
  );
});

test("la consignacion fija multiplica unidades y deriva diferencias de moneda a revision", () => {
  assert.deepEqual(
    calculateSupplierObligation({
      mode: "consignment",
      method: "fixed",
      fixedMinor: 1250,
      agreementCurrency: "ARS",
      saleCurrency: "ARS",
      eligibleBaseMinor: 10_000,
      quantity: 3,
    }),
    { kind: "obligation", supplierAmountMinor: 3750, storeAmountMinor: 6250 },
  );
  assert.deepEqual(
    calculateSupplierObligation({
      mode: "consignment",
      method: "fixed",
      fixedMinor: 1250,
      agreementCurrency: "BRL",
      saleCurrency: "ARS",
      eligibleBaseMinor: 10_000,
      quantity: 1,
    }),
    { kind: "review", reason: "currency_mismatch" },
  );
});

test("solo un admin puede confirmar un pago elegible de una liquidacion aprobada", () => {
  assert.doesNotThrow(() =>
    assertPayoutConfirmation({
      actorRoles: ["admin"],
      settlementStatus: "approved",
      settlementCurrency: "ARS",
      outstandingMinor: 50_000,
      profileStatus: "verified",
      profileCurrency: "ARS",
      amountMinor: 50_000,
      acknowledged: true,
    }),
  );
  for (const [code, override] of [
    ["forbidden", { actorRoles: ["finance"] }],
    ["confirmation_required", { acknowledged: false }],
    ["settlement", { settlementStatus: "draft" }],
    ["profile", { profileStatus: "pending" }],
    ["currency", { profileCurrency: "BRL" }],
    ["amount", { amountMinor: 49_999 }],
    ["amount", { amountMinor: 50_001 }],
  ]) {
    assert.throws(
      () =>
        assertPayoutConfirmation({
          actorRoles: ["admin"],
          settlementStatus: "approved",
          settlementCurrency: "ARS",
          outstandingMinor: 50_000,
          profileStatus: "verified",
          profileCurrency: "ARS",
          amountMinor: 50_000,
          acknowledged: true,
          ...override,
        }),
      (error) =>
        error instanceof PayoutConfirmationError && error.code === code,
    );
  }
});

test("el pago manual exige referencia, fecha y confirmación para cubrir el saldo aprobado", () => {
  assert.equal(
    typeof supplierFinancePolicy.assertManualPayoutConfirmation,
    "function",
  );
  const validate = supplierFinancePolicy.assertManualPayoutConfirmation;
  const valid = {
    actorRoles: ["admin"],
    payoutStatus: "awaiting_approval",
    settlementStatus: "approved",
    settlementApprovedAt: "2026-10-10T15:30:00.000Z",
    settlementCurrency: "ARS",
    outstandingMinor: 50_000,
    amountMinor: 50_000,
    reference: "TRANSFERENCIA-2026-001",
    paidAt: "2026-10-12T15:30:00.000Z",
    acknowledged: true,
  };

  assert.doesNotThrow(() => validate(valid));
  for (const [code, override] of [
    ["forbidden", { actorRoles: ["finance"] }],
    ["confirmation_required", { acknowledged: false }],
    ["payout", { payoutStatus: "submitted" }],
    ["settlement", { settlementStatus: "draft" }],
    ["currency", { settlementCurrency: "BRL" }],
    ["amount", { amountMinor: 49_999 }],
    ["reference", { reference: "  " }],
    ["reference", { reference: "ab" }],
    ["paid_at", { paidAt: "not-a-date" }],
    ["paid_at", { paidAt: "2026-10-09T15:30:00.000Z" }],
    ["paid_at", { paidAt: "2099-01-01T00:00:00.000Z" }],
  ]) {
    assert.throws(
      () => validate({ ...valid, ...override }),
      (error) =>
        error instanceof supplierFinancePolicy.ManualPayoutConfirmationError &&
        error.code === code,
    );
  }
});

test("la liquidación aprobable coincide exactamente con sus obligaciones elegibles", () => {
  assert.equal(
    supplierFinancePolicy.validateSettlementObligations({
      settlementSupplier: 3,
      settlementCurrency: "ARS",
      settlementAmountMinor: 5000,
      obligations: [
        { supplier: 3, currency: "ARS", amountMinor: 3500, status: "eligible" },
        { supplier: 3, currency: "ARS", amountMinor: 1500, status: "eligible" },
      ],
    }),
    true,
  );
  for (const obligations of [
    [],
    [{ supplier: 4, currency: "ARS", amountMinor: 5000, status: "eligible" }],
    [{ supplier: 3, currency: "ARS", amountMinor: 4999, status: "eligible" }],
    [{ supplier: 3, currency: "ARS", amountMinor: 5000, status: "held" }],
  ]) {
    assert.equal(
      supplierFinancePolicy.validateSettlementObligations({
        settlementSupplier: 3,
        settlementCurrency: "ARS",
        settlementAmountMinor: 5000,
        obligations,
      }),
      false,
    );
  }
});

test("el pago automático solo usa un único perfil verificado compatible", () => {
  const verified = { id: 8, supplier: 3, currency: "ARS", status: "verified" };
  assert.equal(
    supplierFinancePolicy.automaticPayoutProfileID({
      supplier: 3,
      currency: "ARS",
      profiles: [verified],
    }),
    8,
  );
  for (const profiles of [
    [],
    [verified, { ...verified, id: 9 }],
    [{ ...verified, status: "pending" }],
    [{ ...verified, supplier: 4 }],
    [{ ...verified, currency: "BRL" }],
  ]) {
    assert.equal(
      supplierFinancePolicy.automaticPayoutProfileID({
        supplier: 3,
        currency: "ARS",
        profiles,
      }),
      null,
    );
  }
});

test("la acreditación cierra el saldo de las obligaciones vinculadas", () => {
  assert.deepEqual(
    supplierFinancePolicy.supplierObligationUpdateForPayout("succeeded"),
    { status: "paid", outstandingMinor: 0 },
  );
  assert.equal(
    supplierFinancePolicy.supplierObligationUpdateForPayout("processing"),
    null,
  );
  assert.equal(
    supplierFinancePolicy.supplierObligationUpdateForPayout("failed"),
    null,
  );
});

test("el adaptador crea un payout ARS idempotente y no confunde aceptado con acreditado", async () => {
  const body = buildMercadoPagoPayoutBody({
    externalReference: "supplier_payout_42",
    description: "Pago proveedor 42",
    recipientEmail: "proveedor@example.test",
    amountMinor: 12_550,
    currency: "ARS",
    notificationURL:
      "https://cms.example.test/api/supplier-payout-webhooks/mercado-pago",
  });
  assert.deepEqual(body, {
    external_reference: "supplier_payout_42",
    description: "Pago proveedor 42",
    config: {
      notification_url:
        "https://cms.example.test/api/supplier-payout-webhooks/mercado-pago",
    },
    transactions: [
      {
        type: "account",
        description: "Pago proveedor 42",
        account: { email: "proveedor@example.test" },
        amount: { currency: "ARS", value: 125.5 },
        external_reference: "supplier_payout_42",
      },
    ],
  });
  let request;
  const submission = await submitMercadoPagoPayout(
    {
      externalReference: "supplier_payout_42",
      description: "Pago proveedor 42",
      recipientEmail: "proveedor@example.test",
      amountMinor: 12_550,
      currency: "ARS",
    },
    {
      accessToken: "TEST-redacted",
      idempotencyKey: "018f47bd-4c30-7d2a-a58e-93784f3123e1",
      testMode: true,
      fetch: async (url, init) => {
        request = { url, init };
        return new Response(
          JSON.stringify({
            id: "POP123",
            status: "created",
            transactions: [{ id: "TOP123" }],
          }),
          { status: 202, headers: { "Content-Type": "application/json" } },
        );
      },
    },
  );
  assert.equal(request.url, "https://api.mercadopago.com/v1/payouts");
  assert.equal(
    request.init.headers["X-Idempotency-Key"],
    "018f47bd-4c30-7d2a-a58e-93784f3123e1",
  );
  assert.equal(request.init.headers.Authorization, "Bearer TEST-redacted");
  assert.equal(request.init.headers["X-test-token"], "true");
  assert.equal(submission.status, "submitted");
  assert.equal(submission.providerStatus, "created");
});

test("la conciliacion solo acredita success/accredited y conserva estados inciertos", async () => {
  for (const [providerStatus, detail, expected] of [
    ["success", "accredited", "succeeded"],
    ["approved", null, "processing"],
    ["transaction_in_process", "pending_bank", "processing"],
    ["rejected", "by_bank", "failed"],
    ["mystery", "later", "reconciliation_required"],
  ]) {
    const result = await getMercadoPagoPayoutStatus(
      { payoutID: "POP123", transactionID: "TOP123" },
      {
        accessToken: "TEST-redacted",
        testMode: true,
        fetch: async () =>
          Response.json({
            id: "TOP123",
            status: providerStatus,
            status_detail: detail,
          }),
      },
    );
    assert.equal(result.status, expected);
    assert.equal(result.providerStatus, providerStatus);
    assert.equal(result.providerStatusDetail, detail);
  }
});

test("el snapshot monetario se convierte a centavos sin punto flotante", () => {
  assert.equal(moneyStringToMinor("123.45"), 12_345);
  assert.equal(moneyStringToMinor("123"), 12_300);
  assert.throws(() => moneyStringToMinor("1.234"));
});

test("una línea pagada deriva una obligación inmutable o una revisión explícita", () => {
  assert.deepEqual(
    deriveSupplierObligation({
      currency: "ARS",
      totalAmount: "123.45",
      quantity: 1,
      terms: {
        mode: "consignment",
        method: "percentage",
        shareBps: 3500,
        currency: "ARS",
        percentageBasis: {
          productDiscounts: "deduct",
          orderDiscounts: "deduct_allocated",
          taxes: "exclude",
          shipping: "exclude",
          tipsDonations: "exclude",
          paymentFees: "store_absorbs",
        },
      },
    }),
    {
      kind: "eligible",
      eligibleBaseMinor: 12_345,
      supplierAmountMinor: 4321,
      storeAmountMinor: 8024,
    },
  );
  assert.deepEqual(
    deriveSupplierObligation({
      currency: "ARS",
      totalAmount: "100.00",
      quantity: 1,
      terms: null,
    }),
    { kind: "review", reason: "missing_agreement", eligibleBaseMinor: 10_000 },
  );
  assert.deepEqual(
    deriveSupplierObligation({
      currency: "ARS",
      totalAmount: "100.00",
      quantity: 1,
      terms: {
        mode: "consignment",
        method: "percentage",
        shareBps: 3500,
        currency: "ARS",
        percentageBasis: {
          productDiscounts: "ignore",
          orderDiscounts: "ignore",
          taxes: "include",
          shipping: "include_allocated",
          tipsDonations: "include_allocated",
          paymentFees: "deduct_actual",
        },
      },
    }),
    { kind: "review", reason: "unsupported_basis", eligibleBaseMinor: 10_000 },
  );
});
