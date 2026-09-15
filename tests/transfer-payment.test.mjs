import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { CommerceSettings } from "../apps/cms/src/globals/CommerceSettings.ts";
import {
  DEFAULT_COMMERCE_SETTINGS,
  isBankTransferAvailable,
  parseCommerceSettings,
} from "../src/lib/commerce/commerce-settings.ts";
import { validateTransferSettings } from "../apps/cms/src/globals/commerceSettingsValidation.ts";
import { createCheckoutSession } from "../src/features/checkout/api.ts";
import { parsePaymentMethod } from "../src/lib/checkout/payment-method.ts";
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
    () => parsePaymentMethod("cash", DEFAULT_COMMERCE_SETTINGS, "en"),
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
  assert.match(summary, /name=\{paymentGroupName\}/);
  assert.match(summary, /disabled=\{fulfillmentDisabled\}/);
  assert.match(provider, /paymentMethod/);
  assert.match(client, /paymentMethod/);
  assert.match(route, /parsePaymentMethod/);
  assert.ok(
    route.indexOf("paymentMethod === BANK_TRANSFER") <
      route.indexOf("commerce.createCheckoutOrder"),
    "la transferencia debe detenerse antes de crear una orden hasta implementar el siguiente hito",
  );
  assert.ok(
    route.indexOf("paymentMethod === BANK_TRANSFER") <
      route.indexOf("!checkout.isConfigured()"),
    "la transferencia no debe depender de la configuración de Mercado Pago",
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
    ]) {
      assert.equal(typeof messages.cart[key], "string", `${locale}.${key}`);
      assert.ok(messages.cart[key].length > 0, `${locale}.${key}`);
    }
  }
});
