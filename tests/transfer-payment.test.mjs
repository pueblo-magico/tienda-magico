import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { CommerceSettings } from "../apps/cms/src/globals/CommerceSettings.ts";
import { ordersCollectionOverride } from "../apps/cms/src/collections/orderCommercialSnapshot.ts";
import {
  DEFAULT_COMMERCE_SETTINGS,
  isBankTransferAvailable,
  parseCommerceSettings,
} from "../src/lib/commerce/commerce-settings.ts";
import { validateTransferSettings } from "../apps/cms/src/globals/commerceSettingsValidation.ts";
import { createCheckoutSession } from "../src/features/checkout/api.ts";
import { createBankTransferSession } from "../src/lib/checkout/bank-transfer.ts";
import { validateCheckoutCustomer } from "../src/lib/checkout/customer.ts";
import { parsePaymentMethod } from "../src/lib/checkout/payment-method.ts";
import {
  buildCheckoutOrderInput,
  getCheckoutOrderByPublicReference,
  normalizePayloadOrderResponse,
} from "../src/lib/commerce/providers/payload-ecommerce/orders.ts";
import { BANK_TRANSFER, MERCADO_PAGO } from "../src/types/checkout.ts";

test("la transferencia permanece deshabilitada hasta configurarla en el CMS", () => {
  assert.equal(DEFAULT_COMMERCE_SETTINGS.transferEnabled, false);
  assert.deepEqual(parseCommerceSettings({}).transfer, {
    accountHolder: "",
    taxId: "",
    alias: "",
    cvu: "",
    paymentWindowMinutes: 15,
  });
});

test("el CMS expone instrucciones de transferencia administrables", () => {
  const fields = CommerceSettings.fields.filter((field) => "name" in field);
  const names = new Set(fields.map((field) => field.name));

  assert.ok(names.has("transferEnabled"));
  assert.ok(names.has("transfer"));

  const transfer = fields.find((field) => field.name === "transfer");
  assert.equal(transfer?.type, "group");
  assert.deepEqual(
    transfer?.fields.map((field) => ("name" in field ? field.name : null)),
    ["accountHolder", "taxId", "alias", "cvu", "paymentWindowMinutes"],
  );
});

test("solo acepta los medios de pago soportados y habilitados", () => {
  assert.equal(
    parsePaymentMethod(undefined, DEFAULT_COMMERCE_SETTINGS),
    MERCADO_PAGO,
  );
  assert.equal(
    parsePaymentMethod(MERCADO_PAGO, DEFAULT_COMMERCE_SETTINGS),
    MERCADO_PAGO,
  );
  assert.throws(
    () => parsePaymentMethod(BANK_TRANSFER, DEFAULT_COMMERCE_SETTINGS, "es"),
    /no está habilitada/i,
  );
  assert.equal(
    parsePaymentMethod(BANK_TRANSFER, {
      ...DEFAULT_COMMERCE_SETTINGS,
      transferEnabled: true,
      transfer: {
        ...DEFAULT_COMMERCE_SETTINGS.transfer,
        enabled: true,
        accountHolder: "Hermanos Mágicos",
        alias: "pueblo.magico",
        cvu: "0000000000000000000000",
      },
    }),
    BANK_TRANSFER,
  );
  assert.throws(
    () => parsePaymentMethod("cheque", DEFAULT_COMMERCE_SETTINGS, "en"),
    /valid payment method/i,
  );
});

test("normaliza los datos de transferencia y limita el plazo", () => {
  const parsed = parseCommerceSettings({
    transferEnabled: true,
    transfer: {
      accountHolder: "  Hermanos Mágicos  ",
      taxId: " 30-00000000-0 ",
      alias: " pueblo.magico ",
      cvu: null,
      paymentWindowMinutes: "30",
    },
  });

  assert.deepEqual(parsed.transfer, {
    accountHolder: "Hermanos Mágicos",
    taxId: "30-00000000-0",
    alias: "pueblo.magico",
    cvu: "",
    paymentWindowMinutes: 30,
  });
  assert.equal(isBankTransferAvailable(parsed), true);
  assert.equal(
    parseCommerceSettings({
      transferEnabled: true,
      transfer: { paymentWindowMinutes: 0 },
    }).transfer.paymentWindowMinutes,
    15,
  );
});

test("no publica una transferencia habilitada pero incompleta", () => {
  assert.equal(
    isBankTransferAvailable({
      ...DEFAULT_COMMERCE_SETTINGS,
      transferEnabled: true,
    }),
    false,
  );

  assert.throws(
    () =>
      validateTransferSettings({
        data: { transferEnabled: true, transfer: {} },
        req: { locale: "es" },
      }),
    (error) => {
      assert.equal(error.name, "ValidationError");
      assert.deepEqual(
        error.data.errors.map(({ path, message }) => ({ path, message })),
        [
          {
            path: "transfer.accountHolder",
            message:
              "Ingresá el titular de la cuenta antes de habilitar la transferencia.",
          },
          {
            path: "transfer.alias",
            message:
              "Ingresá un alias o CVU antes de habilitar la transferencia.",
          },
        ],
      );
      return true;
    },
  );

  const valid = {
    transferEnabled: true,
    transfer: { accountHolder: "Hermanos Mágicos", alias: "pueblo.magico" },
  };
  assert.equal(
    validateTransferSettings({ data: valid, req: { locale: "es" } }),
    valid,
  );
});

test("el cliente serializa la transferencia en la solicitud de checkout", async () => {
  const originalFetch = globalThis.fetch;
  let requestBody;

  globalThis.fetch = async (_url, init) => {
    requestBody = JSON.parse(String(init?.body));
    return new Response(
      JSON.stringify({
        session: {
          id: "checkout-1",
          provider: "bank-transfer",
          redirectUrl: "/es/pedido/checkout-1",
          status: "pending",
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    await createCheckoutSession({
      cartId: "cart-1",
      locale: "es",
      paymentMethod: BANK_TRANSFER,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(requestBody.paymentMethod, BANK_TRANSFER);
});

test("crea una sesión pendiente de transferencia con vencimiento y referencia", () => {
  const session = createBankTransferSession({
    baseUrl: "https://tienda.example",
    locale: "es",
    orderId: "42",
    paymentWindowMinutes: 15,
    now: new Date("2026-09-15T12:00:00.000Z"),
  });

  assert.deepEqual(session, {
    id: "transfer:42",
    provider: BANK_TRANSFER,
    redirectUrl:
      "https://tienda.example/es/checkout/pending?payment_method=bank-transfer&order=42&from=cart",
    status: "pending",
    expiresAt: "2026-09-15T12:15:00.000Z",
  });
});

test("persiste el medio y vencimiento en el pedido pendiente", () => {
  const input = buildCheckoutOrderInput(
    {
      id: "1::secret",
      checkoutUrl: "https://example.test/checkout",
      fulfillmentMode: "local_collection",
      lines: [],
      totalQuantity: 0,
      cost: {
        subtotalAmount: { amount: "2000", currencyCode: "ARS" },
        totalAmount: { amount: "2000", currencyCode: "ARS" },
      },
    },
    {},
    {
      paymentMethod: BANK_TRANSFER,
      paymentExpiresAt: "2026-09-15T12:15:00.000Z",
    },
  );

  assert.equal(input.paymentMethod, BANK_TRANSFER);
  assert.equal("publicReference" in input, false);
  assert.equal(input.checkoutKey, "checkout:1::secret:bank-transfer");
  assert.equal(input.paymentExpiresAt, "2026-09-15T12:15:00.000Z");
  assert.equal(input.status, "processing");
  assert.equal(input.paymentStatus, "pending");
  assert.equal(input.commercialSnapshot.paymentMethod, BANK_TRANSFER);
  assert.equal(
    input.commercialSnapshot.paymentExpiresAt,
    "2026-09-15T12:15:00.000Z",
  );
});

test("carga las instrucciones pendientes desde el pedido persistido", async () => {
  const originalFetch = globalThis.fetch;
  process.env.PAYLOAD_ECOMMERCE_URL = "https://cms.example";
  process.env.PAYLOAD_ECOMMERCE_API_KEY = "test-key";
  let requestedUrl;

  globalThis.fetch = async (url) => {
    requestedUrl = String(url);
    return new Response(
      JSON.stringify({
        docs: [
          {
            id: 4,
            publicReference: "018f5f4e-7b62-7f42-a28f-74dd95bb7cf8",
            paymentMethod: BANK_TRANSFER,
            paymentStatus: "pending",
            paymentExpiresAt: "2026-09-15T12:15:00.000Z",
            amount: 200000,
            currency: "ARS",
          },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    const order = await getCheckoutOrderByPublicReference(
      "018f5f4e-7b62-7f42-a28f-74dd95bb7cf8",
    );
    assert.equal(order?.total.amount, "2000");
    assert.equal(order?.paymentStatus, "pending");
    assert.match(requestedUrl, /where%5BpublicReference%5D%5Bequals%5D/);
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.PAYLOAD_ECOMMERCE_URL;
    delete process.env.PAYLOAD_ECOMMERCE_API_KEY;
  }
});

test("normaliza la respuesta envuelta del primer pedido creado", () => {
  assert.deepEqual(
    normalizePayloadOrderResponse({
      doc: {
        id: 4,
        publicReference: "018f5f4e-7b62-7f42-a28f-74dd95bb7cf8",
        paymentExpiresAt: "2026-09-15T12:15:00.000Z",
      },
    }),
    {
      id: "4",
      publicReference: "018f5f4e-7b62-7f42-a28f-74dd95bb7cf8",
      paymentExpiresAt: "2026-09-15T12:15:00.000Z",
      paymentMethod: MERCADO_PAGO,
      paymentStatus: "unverified",
      total: { amount: "0", currencyCode: "ARS" },
    },
  );
});

test("exige los datos del comprador antes de crear el pedido", () => {
  assert.throws(() => validateCheckoutCustomer({}, "es"), /nombre y tu email/i);
  assert.deepEqual(
    validateCheckoutCustomer(
      { name: "  Julieta  ", email: " JULIETA@example.com " },
      "es",
    ),
    { name: "Julieta", email: "julieta@example.com" },
  );
});

test("los pedidos existentes conservan Mercado Pago como valor predeterminado", () => {
  const input = buildCheckoutOrderInput({
    id: "cart-legacy",
    checkoutUrl: "https://example.test/checkout",
    fulfillmentMode: "delivery",
    lines: [],
    totalQuantity: 0,
    cost: {
      subtotalAmount: { amount: "2000", currencyCode: "ARS" },
      totalAmount: { amount: "2000", currencyCode: "ARS" },
    },
  });

  assert.equal(input.paymentMethod, MERCADO_PAGO);
  assert.equal(input.commercialSnapshot.paymentMethod, MERCADO_PAGO);
  assert.equal(input.checkoutKey, "checkout:cart-legacy");
});

test("la venta local vinculada recibe los datos pendientes de la transferencia", async () => {
  const collection = ordersCollectionOverride({
    defaultCollection: { fields: [], hooks: {} },
  });
  const afterChange = collection.hooks?.afterChange?.[0];
  let createdData;

  await afterChange({
    operation: "create",
    doc: {
      id: 42,
      fulfillmentMode: "local_collection",
      paymentMethod: BANK_TRANSFER,
      paymentExpiresAt: "2026-09-15T12:15:00.000Z",
      commercialSnapshot: { cartId: "cart-1" },
    },
    req: {
      payload: {
        find: async () => ({ docs: [] }),
        create: async ({ data }) => {
          createdData = data;
          return data;
        },
      },
    },
  });

  assert.equal(createdData.paymentMethod, BANK_TRANSFER);
  assert.equal(createdData.paymentExpiresAt, "2026-09-15T12:15:00.000Z");
  assert.equal(createdData.status, "pending_payment");
  assert.equal(createdData.paymentStatus, "pending");
});

test("el carrito envía el medio elegido al límite de checkout", async () => {
  const [summary, provider, client, route] = await Promise.all([
    readFile("src/features/cart/components/CartSummary.tsx", "utf8"),
    readFile("src/features/cart/CartProvider.tsx", "utf8"),
    readFile("src/features/checkout/api.ts", "utf8"),
    readFile("src/app/api/checkout/route.ts", "utf8"),
  ]);

  assert.match(summary, /paymentMethod/);
  assert.match(summary, /BANK_TRANSFER/);
  assert.match(summary, /isBankTransferAvailable\(commerceSettings\)/);
  assert.match(summary, /buyerName/);
  assert.match(summary, /buyerEmail/);
  assert.match(summary, /hasBuyerDetails/);
  assert.match(summary, /name=\{paymentGroupName\}/);
  assert.match(summary, /disabled=\{fulfillmentDisabled\}/);
  assert.match(provider, /paymentMethod/);
  assert.match(client, /paymentMethod/);
  assert.match(route, /parsePaymentMethod/);
  assert.doesNotMatch(route, /status:\s*501/);
  assert.match(route, /createBankTransferSession/);
  assert.match(route, /paymentExpiresAt/);
  assert.match(
    route,
    /expiresAt: order\.paymentExpiresAt \?\? paymentExpiresAt/,
  );
  assert.match(
    route,
    /paymentMethod === MERCADO_PAGO && !checkout\.isConfigured\(\)/,
  );
});

test("la migración agrega y revierte toda la configuración de transferencia", async () => {
  const migration = await readFile(
    "apps/cms/src/migrations/20260915_120000_payment_method_transfer.ts",
    "utf8",
  );

  for (const column of [
    "transfer_enabled",
    "transfer_account_holder",
    "transfer_tax_id",
    "transfer_alias",
    "transfer_cvu",
    "transfer_payment_window_minutes",
  ]) {
    assert.match(migration, new RegExp(`ADD COLUMN "${column}"`));
    assert.match(migration, new RegExp(`DROP COLUMN "${column}"`));
  }
});

test("el pedido y la venta local persisten el estado pendiente de transferencia", async () => {
  const [orders, localSales, migration, referenceMigration] = await Promise.all(
    [
      readFile("apps/cms/src/collections/orderCommercialSnapshot.ts", "utf8"),
      readFile("apps/cms/src/collections/LocalSales.ts", "utf8"),
      readFile(
        "apps/cms/src/migrations/20260915_150000_pending_transfer_orders.ts",
        "utf8",
      ),
      readFile(
        "apps/cms/src/migrations/20260915_160000_order_public_reference.ts",
        "utf8",
      ),
    ],
  );

  for (const source of [orders, localSales]) {
    assert.match(source, /name: 'paymentMethod'/);
    assert.match(source, /name: 'paymentExpiresAt'/);
    assert.match(source, /value: 'bank-transfer'/);
  }
  for (const column of ["payment_method", "payment_expires_at"]) {
    assert.match(migration, new RegExp(`ADD COLUMN "${column}"`));
    assert.match(migration, new RegExp(`DROP COLUMN "${column}"`));
  }
  assert.match(referenceMigration, /ADD COLUMN "public_reference"/);
  assert.match(
    referenceMigration,
    /CREATE UNIQUE INDEX "orders_public_reference_idx"/,
  );
  assert.match(orders, /name: 'publicReference'/);
  assert.match(orders, /randomUUID\(\)/);
  assert.match(orders, /name: 'paymentStatus'/);
  assert.match(migration, /enum_orders_payment_status/);
});

test("los dos idiomas incluyen los textos del selector de pago", async () => {
  for (const locale of ["es", "en"]) {
    const messages = JSON.parse(
      await readFile(`messages/${locale}.json`, "utf8"),
    );
    for (const key of [
      "paymentLegend",
      "mercadoPago",
      "mercadoPagoHint",
      "bankTransfer",
      "bankTransferHint",
      "buyerRequired",
      "senderIdentification",
      "identificationType",
      "identificationNumber",
      "identificationHint",
    ]) {
      assert.equal(typeof messages.cart[key], "string", `${locale}.${key}`);
      assert.ok(messages.cart[key].length > 0, `${locale}.${key}`);
    }
    for (const key of [
      "transferBody",
      "accountHolder",
      "amount",
      "orderReference",
      "expiresAt",
    ]) {
      assert.equal(
        typeof messages.checkout.pending[key],
        "string",
        `${locale}.${key}`,
      );
    }
  }
});
