import assert from "node:assert/strict";
import { test } from "node:test";
import {
  confirmationInput,
  validateTransfer,
  inventoryLines,
} from "../apps/cms/src/utilities/transferConfirmationPolicy.ts";
import {
  confirmTransferEndpoint,
  protectTransfer,
} from "../apps/cms/src/utilities/confirmTransfer.ts";
import { quotedInventory } from "../apps/cms/src/utilities/confirmOrderInventory.ts";

test("el snapshot debe coincidir con las líneas, SKU, moneda e importe persistidos", () => {
  const line = {
    productId: "1",
    merchandiseId: "product:1",
    sku: "SKU-1",
    quantity: 2,
    unitPrice: { amount: "12.50", currencyCode: "ARS" },
    total: { amount: "25.00", currencyCode: "ARS" },
  };
  const quote = {
    items: [{ product: 1, quantity: 2 }],
    amount: 2500,
    currency: "ARS",
    commercialSnapshot: { items: [line] },
  };
  assert.deepEqual(quotedInventory(quote), [
    {
      collection: "products",
      id: 1,
      product: 1,
      quantity: 2,
      price: 1250,
      sku: "SKU-1",
    },
  ]);
  for (const patch of [
    { quantity: 1 },
    { sku: null },
    { merchandiseId: "variant:9" },
    { unitPrice: { amount: "12.501", currencyCode: "ARS" } },
    { total: { amount: "25", currencyCode: "USD" } },
  ]) {
    assert.throws(
      () =>
        quotedInventory({
          ...quote,
          commercialSnapshot: { items: [{ ...line, ...patch }] },
        }),
      { code: "catalog" },
    );
  }
  assert.throws(() => quotedInventory({ ...quote, amount: 1 }), {
    code: "catalog",
  });
});

test("rechaza confirmaciones sin evidencia, importe exacto o aceptación explícita", () => {
  for (const input of [
    null,
    {},
    { reference: "MP-123", amount: 100 },
    { reference: "MP-123", amount: -1, received: true },
    { reference: "MP-123", amount: 1.5, received: true },
  ]) {
    assert.throws(() => confirmationInput(input));
  }
});

const input = { reference: "MP-123", amount: 12000, acceptLate: false };
const order = {
  paymentMethod: "bank-transfer",
  paymentStatus: "pending",
  status: "processing",
  amount: 12000,
  currency: "ARS",
  paymentExpiresAt: "2026-09-17T12:00:00Z",
};
test("valida importe, método, estado y vencimiento sin tratar la declaración como pago", () => {
  assert.equal(
    validateTransfer(order, input, Date.parse("2026-09-17T11:00:00Z")),
    false,
  );
  for (const patch of [
    { amount: 1 },
    { currency: "USD" },
    { paymentMethod: "mercado-pago" },
    { paymentStatus: "approved" },
    { paymentStatus: "cancelled" },
    { status: "refunded" },
    { paymentExpiresAt: null },
  ]) {
    assert.throws(() =>
      validateTransfer(
        { ...order, ...patch },
        input,
        Date.parse("2026-09-17T11:00:00Z"),
      ),
    );
  }
  assert.throws(
    () => validateTransfer(order, input, Date.parse(order.paymentExpiresAt)),
    { code: "late" },
  );
  assert.equal(
    validateTransfer(
      order,
      { ...input, acceptLate: true },
      Date.parse(order.paymentExpiresAt),
    ),
    true,
  );
});

test("agrupa stock repetido y rechaza identidades y cantidades inválidas", () => {
  assert.deepEqual(
    inventoryLines([
      { product: 1, variant: 2, quantity: 1 },
      { product: 1, variant: 2, quantity: 2 },
    ]),
    [{ collection: "variants", id: 2, product: 1, quantity: 3 }],
  );
  for (const items of [
    [],
    null,
    [{ product: 1, quantity: 0 }],
    [{ product: 1, quantity: 1.5 }],
    [{ product: 1, variant: "2", quantity: 1 }],
    [
      { product: 1, variant: 2, quantity: 1 },
      { product: 3, variant: 2, quantity: 1 },
    ],
  ])
    assert.throws(() => inventoryLines(items));
});

test("el endpoint rechaza anónimos, clientes y solicitudes de otro origen antes de acceder a datos", async () => {
  for (const user of [null, { roles: ["customer"] }, { roles: ["editor"] }]) {
    assert.equal((await confirmTransferEndpoint.handler({ user })).status, 403);
  }
  assert.equal(
    (
      await confirmTransferEndpoint.handler({
        user: { roles: ["admin"] },
        payload: { config: { serverURL: "http://localhost:4000" } },
        headers: new Headers({ origin: "https://otro.example" }),
      })
    ).status,
    403,
  );
});

test("no permite falsificar pagos ni modificar líneas o auditoría mediante REST", () => {
  for (const data of [
    { paymentStatus: "approved" },
    { transferVerification: { verifiedBy: 1 } },
    { amount: 1 },
    { items: [] },
  ]) {
    assert.throws(() =>
      protectTransfer({
        data,
        originalDoc: order,
        operation: "update",
        req: { context: {} },
      }),
    );
  }
  assert.throws(() =>
    protectTransfer({
      data: { ...order, paymentStatus: "approved" },
      operation: "create",
      req: { context: {} },
    }),
  );
  assert.deepEqual(
    protectTransfer({
      data: { transferReportedAt: "2026-09-17" },
      originalDoc: order,
      operation: "update",
      req: { context: {} },
    }),
    { transferReportedAt: "2026-09-17" },
  );
});

test("normaliza referencia y conserva importe en centavos y aceptación de pago tardío", () => {
  assert.deepEqual(
    confirmationInput({
      reference: " mp-123 ",
      amount: 12000,
      received: true,
      acceptLate: true,
    }),
    { reference: "MP-123", amount: 12000, acceptLate: true },
  );
});
