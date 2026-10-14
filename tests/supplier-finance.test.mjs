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
  createFakePayoutProvider,
  createManualPayoutProvider,
  createMercadoPagoPayoutProvider,
  resolveConfiguredSupplierPayoutProvider,
} from "../apps/cms/src/lib/supplierFinance/supplierPayoutProviders.ts";
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
  assert.doesNotThrow(() =>
    assertPayoutConfirmation({
      actorRoles: ["admin"],
      settlementStatus: "partially_paid",
      settlementCurrency: "ARS",
      outstandingMinor: 25_000,
      profileStatus: "verified",
      profileCurrency: "ARS",
      amountMinor: 25_000,
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

test("la politica bloquea envios por defecto y mantiene separado el modo automatico", () => {
  for (const [code, policy, mode] of [
    [
      "emergency_stop",
      {
        emergencyStop: true,
        outboundProviderPaymentsEnabled: true,
        automaticProviderPaymentsEnabled: true,
      },
      "confirmed",
    ],
    [
      "outbound_disabled",
      {
        emergencyStop: false,
        outboundProviderPaymentsEnabled: false,
        automaticProviderPaymentsEnabled: false,
      },
      "confirmed",
    ],
    [
      "automatic_disabled",
      {
        emergencyStop: false,
        outboundProviderPaymentsEnabled: true,
        automaticProviderPaymentsEnabled: false,
      },
      "automatic",
    ],
  ]) {
    assert.throws(
      () =>
        supplierFinancePolicy.assertSupplierPayoutExecutionPolicy(policy, mode),
      (error) => error.code === code,
    );
  }

  assert.doesNotThrow(() =>
    supplierFinancePolicy.assertSupplierPayoutExecutionPolicy(
      {
        emergencyStop: false,
        outboundProviderPaymentsEnabled: true,
        automaticProviderPaymentsEnabled: false,
      },
      "confirmed",
    ),
  );
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
  assert.doesNotThrow(() => validate({ ...valid, amountMinor: 25_000 }));
  assert.doesNotThrow(() =>
    validate({ ...valid, paidAt: "2026-10-10T00:00:00.000Z" }),
  );
  for (const [code, override] of [
    ["forbidden", { actorRoles: ["finance"] }],
    ["confirmation_required", { acknowledged: false }],
    ["payout", { payoutStatus: "submitted" }],
    ["settlement", { settlementStatus: "draft" }],
    ["currency", { settlementCurrency: "BRL" }],
    ["amount", { amountMinor: 50_001 }],
    ["amount", { amountMinor: 99 }],
    ["amount", { amountMinor: 0 }],
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

test("un pago parcial se asigna de forma determinista y conserva el saldo restante", () => {
  assert.equal(
    typeof supplierFinancePolicy.allocateSupplierPayment,
    "function",
  );
  const allocate = supplierFinancePolicy.allocateSupplierPayment;
  assert.deepEqual(
    allocate({
      amountMinor: 4000,
      obligations: [
        { id: 10, status: "approved", outstandingMinor: 3000 },
        { id: 11, status: "approved", outstandingMinor: 5000 },
      ],
    }),
    {
      allocations: [
        {
          id: 10,
          appliedMinor: 3000,
          outstandingMinor: 0,
          status: "paid",
        },
        {
          id: 11,
          appliedMinor: 1000,
          outstandingMinor: 4000,
          status: "partially_paid",
        },
      ],
      outstandingMinor: 4000,
      status: "partially_paid",
    },
  );
  assert.equal(
    allocate({
      amountMinor: 8001,
      obligations: [
        { id: 10, status: "approved", outstandingMinor: 3000 },
        { id: 11, status: "approved", outstandingMinor: 5000 },
      ],
    }),
    null,
  );
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
            external_reference: "supplier_payout_42",
            status: providerStatus,
            status_detail: detail,
            amount: { currency: "ARS", value: "125.50" },
          }),
      },
    );
    assert.equal(result.status, expected);
    assert.equal(result.providerStatus, providerStatus);
    assert.equal(result.providerStatusDetail, detail);
  }
});

test("la consulta autoritativa rechaza identidad, importe o moneda incompletos", async () => {
  const valid = {
    id: "TOP123",
    external_reference: "supplier_payout_42",
    status: "approved",
    status_detail: null,
    amount: { currency: "ARS", value: "125.50" },
  };
  for (const body of [
    { ...valid, external_reference: null },
    { ...valid, amount: { currency: "USD", value: "125.50" } },
    { ...valid, amount: { currency: "ARS", value: "125.555" } },
    { ...valid, amount: null },
  ]) {
    await assert.rejects(
      getMercadoPagoPayoutStatus(
        { payoutID: "POP123", transactionID: "TOP123" },
        {
          accessToken: "TEST-redacted",
          testMode: true,
          fetch: async () => Response.json(body),
        },
      ),
      (error) => error.code === "uncertain",
    );
  }
});

test("el proveedor de Mercado Pago normaliza envío, consulta y capacidades", async () => {
  const requests = [];
  const provider = createMercadoPagoPayoutProvider({
    accessToken: "TEST-redacted",
    testMode: true,
    fetch: async (url, init) => {
      requests.push({ url, init });
      if (init?.method === "POST") {
        return Response.json(
          {
            id: "POP123",
            status: "created",
            transactions: [{ id: "TOP123" }],
          },
          { status: 202 },
        );
      }
      return Response.json({
        id: "TOP123",
        external_reference: "supplier_payout_42",
        status: "success",
        status_detail: "accredited",
        amount: { currency: "ARS", value: "125.50" },
      });
    },
  });

  assert.equal(provider.id, "mercado-pago");
  assert.deepEqual(provider.capabilities, {
    submit: true,
    queryStatus: true,
    notifications: true,
    cancel: false,
  });
  const submission = await provider.submit({
    externalReference: "supplier_payout_42",
    description: "Pago proveedor 42",
    recipient: { kind: "email", value: "proveedor@example.test" },
    amountMinor: 12_550,
    currency: "ARS",
    idempotencyKey: "018f47bd-4c30-7d2a-a58e-93784f3123e1",
  });
  assert.equal(submission.provider, "mercado-pago");
  assert.deepEqual(await provider.getStatus(submission), {
    status: "succeeded",
    providerStatus: "success",
    providerStatusDetail: "accredited",
    externalReference: "supplier_payout_42",
    amountMinor: 12_550,
    currency: "ARS",
  });
  assert.equal(requests.length, 2);
});

test("la notificación de Payouts se normaliza sin confiar en su estado", () => {
  const provider = createMercadoPagoPayoutProvider({
    accessToken: "TEST-redacted",
    testMode: true,
  });
  assert.deepEqual(
    provider.parseNotification({
      created_date: "2026-01-29T15:20:25.470Z",
      external_reference: "supplier_payout_42",
      id: "TOP123",
      last_updated_date: "2026-01-29T15:21:25.470Z",
      payout: {
        external_reference: "supplier_payout_42",
        id: "POP123",
        notification_url:
          "https://cms.example.test/api/supplier-payouts/webhooks/mercado-pago",
      },
      status: "success",
      status_detail: "accredited",
    }),
    {
      payoutID: "POP123",
      transactionID: "TOP123",
      externalReference: "supplier_payout_42",
      providerStatus: "success",
      providerStatusDetail: "accredited",
      occurredAt: "2026-01-29T15:21:25.470Z",
    },
  );
});

test("la notificación rechaza referencias contradictorias y datos no válidos", () => {
  const provider = createMercadoPagoPayoutProvider({
    accessToken: "TEST-redacted",
    testMode: true,
  });
  const valid = {
    created_date: "2026-01-29T15:20:25.470Z",
    external_reference: "supplier_payout_42",
    id: "TOP123",
    last_updated_date: "2026-01-29T15:21:25.470Z",
    payout: { external_reference: "supplier_payout_42", id: "POP123" },
    status: "approved",
  };
  for (const value of [
    { ...valid, id: "../../TOP123" },
    { ...valid, last_updated_date: "no-es-fecha" },
    { ...valid, payout: { ...valid.payout, external_reference: "otro_pago" } },
    { ...valid, status: "APPROVED" },
  ]) {
    assert.throws(
      () => provider.parseNotification(value),
      (error) => error.code === "invalid",
    );
  }
});

test("el proveedor manual declara que no puede enviar ni consultar externamente", async () => {
  const provider = createManualPayoutProvider();
  assert.equal(provider.id, "manual");
  assert.deepEqual(provider.capabilities, {
    submit: false,
    queryStatus: false,
    notifications: false,
    cancel: false,
  });
  await assert.rejects(
    provider.submit({
      externalReference: "supplier_payout_42",
      description: "Pago proveedor 42",
      recipient: { kind: "email", value: "proveedor@example.test" },
      amountMinor: 12_550,
      currency: "ARS",
      idempotencyKey: "018f47bd-4c30-7d2a-a58e-93784f3123e1",
    }),
    (error) => error.code === "unsupported",
  );
});

test("el proveedor falso es determinista e idempotente para pruebas", async () => {
  const provider = createFakePayoutProvider({ status: "processing" });
  const request = {
    externalReference: "supplier_payout_42",
    description: "Pago proveedor 42",
    recipient: { kind: "email", value: "proveedor@example.test" },
    amountMinor: 12_550,
    currency: "ARS",
    idempotencyKey: "018f47bd-4c30-7d2a-a58e-93784f3123e1",
  };
  const first = await provider.submit(request);
  const repeated = await provider.submit(request);
  assert.deepEqual(repeated, first);
  assert.equal((await provider.getStatus(first)).status, "processing");
});

test("el registro productivo rechaza proveedores desconocidos o falsos", () => {
  assert.throws(
    () =>
      resolveConfiguredSupplierPayoutProvider("fake", {
        MERCADOPAGO_PAYOUTS_ACCESS_TOKEN: "TEST-redacted",
        MERCADOPAGO_PAYOUTS_TEST_MODE: "true",
      }),
    (error) => error.code === "configuration",
  );
  assert.throws(
    () => resolveConfiguredSupplierPayoutProvider("unknown", {}),
    (error) => error.code === "configuration",
  );
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
