import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  DEFAULT_COMMERCE_SETTINGS,
  parseCommerceSettings,
} from "../src/lib/commerce/commerce-settings.ts";
import { createCashSession } from "../src/lib/checkout/cash.ts";
import { parsePaymentMethod } from "../src/lib/checkout/payment-method.ts";
import { buildCheckoutOrderInput } from "../src/lib/commerce/providers/payload-ecommerce/orders.ts";
import { CASH } from "../src/types/checkout.ts";
import {
  cashConfirmationInput,
  confirmCashEndpoint,
} from "../apps/cms/src/utilities/confirmCash.ts";
import { protectTransfer } from "../apps/cms/src/utilities/confirmTransfer.ts";

const cashSettings = {
  ...DEFAULT_COMMERCE_SETTINGS,
  cashEnabled: true,
};

test("el efectivo queda deshabilitado por defecto y se publica desde el CMS", () => {
  assert.equal(DEFAULT_COMMERCE_SETTINGS.cashEnabled, false);
  assert.equal(parseCommerceSettings({ cashEnabled: true }).cashEnabled, true);
});

test("el efectivo solo se acepta para retiro local", () => {
  assert.equal(
    parsePaymentMethod(CASH, cashSettings, "es", "local_collection"),
    CASH,
  );
  assert.throws(
    () => parsePaymentMethod(CASH, cashSettings, "es", "delivery"),
    /retiro local/i,
  );
  assert.throws(
    () =>
      parsePaymentMethod(
        CASH,
        DEFAULT_COMMERCE_SETTINGS,
        "es",
        "local_collection",
      ),
    /no está habilitado/i,
  );
});

test("crea una sesión pendiente de efectivo sin vencimiento", () => {
  assert.deepEqual(
    createCashSession({
      baseUrl: "https://tienda.example",
      locale: "es",
      orderId: "pedido-42",
    }),
    {
      id: "cash:pedido-42",
      provider: CASH,
      redirectUrl:
        "https://tienda.example/es/checkout/pending?payment_method=cash&order=pedido-42&from=cart",
      status: "pending",
      expiresAt: null,
    },
  );
});

test("persiste un pedido en efectivo con clave idempotente propia", () => {
  const input = buildCheckoutOrderInput(
    {
      id: "cart-cash::secret",
      checkoutUrl: "",
      fulfillmentMode: "local_collection",
      lines: [],
      totalQuantity: 0,
      cost: {
        subtotalAmount: { amount: "2000", currencyCode: "ARS" },
        totalAmount: { amount: "2000", currencyCode: "ARS" },
      },
    },
    {},
    { paymentMethod: CASH },
  );

  assert.equal(input.paymentMethod, CASH);
  assert.equal(input.checkoutKey, "checkout:cart-cash::secret:cash");
  assert.equal(input.paymentStatus, "pending");
  assert.equal(input.paymentExpiresAt, null);
  assert.equal(input.commercialSnapshot.paymentMethod, CASH);
});

test("el storefront y el CMS incluyen selección, espera y confirmación de efectivo", async () => {
  const [
    summary,
    route,
    pending,
    orderSchema,
    localSales,
    settings,
    messagesEs,
    messagesEn,
  ] = await Promise.all([
    readFile("src/features/cart/components/CartSummary.tsx", "utf8"),
    readFile("src/app/api/checkout/route.ts", "utf8"),
    readFile("src/app/[locale]/checkout/pending/page.tsx", "utf8"),
    readFile("apps/cms/src/collections/orderCommercialSnapshot.ts", "utf8"),
    readFile("apps/cms/src/collections/LocalSales.ts", "utf8"),
    readFile("apps/cms/src/globals/CommerceSettings.ts", "utf8"),
    readFile("messages/es.json", "utf8"),
    readFile("messages/en.json", "utf8"),
  ]);

  assert.match(summary, /CASH/);
  assert.match(summary, /cashEnabled/);
  assert.match(route, /createCashSession/);
  assert.match(pending, /CashWaiting/);
  assert.match(settings, /name: 'cashEnabled'/);
  for (const source of [orderSchema, localSales])
    assert.match(source, /value: 'cash'/);
  for (const raw of [messagesEs, messagesEn]) {
    const messages = JSON.parse(raw);
    assert.equal(typeof messages.cart.cash, "string");
    assert.equal(typeof messages.cart.cashHint, "string");
    assert.equal(typeof messages.checkout.pending.cashBody, "string");
  }
});

test("la confirmación exige importe entero positivo y recepción explícita", () => {
  assert.deepEqual(
    cashConfirmationInput({
      amount: 12000,
      received: true,
      note: "  Caja 1  ",
    }),
    { amount: 12000, received: true, note: "Caja 1" },
  );
  for (const input of [
    null,
    {},
    { amount: 12000 },
    { amount: 0, received: true },
    { amount: 1.5, received: true },
    { amount: true, received: true },
    { amount: [12000], received: true },
    { amount: "12000", received: true },
    { amount: Number.MAX_SAFE_INTEGER + 1, received: true },
    { amount: Infinity, received: true },
    { amount: 12000, received: "true" },
  ]) {
    assert.throws(() => cashConfirmationInput(input));
  }
});

test("nadie puede autoconfirmar efectivo por la API pública", async () => {
  for (const user of [null, { roles: ["customer"] }, { roles: ["staff"] }]) {
    assert.equal((await confirmCashEndpoint.handler({ user })).status, 403);
  }
  assert.throws(() =>
    protectTransfer({
      data: { paymentStatus: "approved", cashVerification: { verifiedBy: 1 } },
      originalDoc: { paymentMethod: CASH, paymentStatus: "pending" },
      operation: "update",
      req: { context: {} },
    }),
  );
  assert.throws(() =>
    protectTransfer({
      data: {
        paymentMethod: CASH,
        paymentStatus: "pending",
        cashVerification: { verifiedBy: 1 },
      },
      operation: "create",
      req: { context: {} },
    }),
  );
});

test("la migración de efectivo bloquea el rollback si hay historial de efectivo", async () => {
  const migration = await readFile(
    "apps/cms/src/migrations/20260917_130000_cash_payment.ts",
    "utf8",
  );
  assert.match(migration, /ADD VALUE IF NOT EXISTS 'cash'/);
  assert.match(migration, /ADD COLUMN "cash_enabled"/);
  assert.match(migration, /ADD COLUMN "cash_verification"/);
  assert.match(migration, /WHERE "payment_method" = 'cash'/);
  assert.match(migration, /RAISE EXCEPTION/);
  assert.doesNotMatch(migration, /UPDATE "orders" SET "payment_method"/);
  assert.match(migration, /DROP COLUMN "cash_enabled"/);
  assert.match(migration, /DROP COLUMN "cash_verification"/);
});
