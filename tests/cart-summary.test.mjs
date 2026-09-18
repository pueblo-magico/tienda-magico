import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { CartSummary } from "../src/features/cart/components/CartSummary.tsx";
import { DEFAULT_COMMERCE_SETTINGS } from "../src/lib/commerce/commerce-settings.ts";
import { LOCAL_COLLECTION } from "../src/lib/commerce/local-purchase.ts";
import { BANK_TRANSFER, MERCADO_PAGO } from "../src/types/checkout.ts";

async function renderSummary(locale, overrides = {}) {
  const messages = JSON.parse(
    await readFile(
      new URL(`../messages/${locale}.json`, import.meta.url),
      "utf8",
    ),
  );
  const money = { amount: "84000", currencyCode: "ARS" };
  const props = {
    cart: {
      totalQuantity: 3,
      fulfillmentMode: LOCAL_COLLECTION,
      cost: { subtotalAmount: money, totalAmount: money },
    },
    commerceSettings: DEFAULT_COMMERCE_SETTINGS,
    paymentMethod: MERCADO_PAGO,
    buyerName: "Prueba",
    buyerEmail: "prueba@example.com",
    identification: { type: "DNI", number: "" },
    labels: messages.cart,
    onCheckout() {},
    onIdentificationChange() {},
    onBuyerNameChange() {},
    onBuyerEmailChange() {},
    onPaymentMethodChange() {},
    onFulfillmentModeChange() {},
    ...overrides,
  };
  return renderToStaticMarkup(
    createElement(
      NextIntlClientProvider,
      { locale, messages, timeZone: "UTC" },
      createElement(CartSummary, props),
    ),
  );
}

for (const locale of ["es", "en"]) {
  test(`el resumen ${locale} muestra secciones abiertas y el importe real`, async () => {
    const html = await renderSummary(locale);
    assert.equal((html.match(/aria-expanded="true"/g) ?? []).length, 3);
    assert.match(html, locale === "es" ? /Revisar compra/ : /Review purchase/);
    assert.doesNotMatch(html, /value="delivery"/);
    assert.doesNotMatch(html, /identification-number/);
    assert.doesNotMatch(html, /<button[^>]* disabled=""/);
  });
}

test("la transferencia muestra documento y bloquea el pago sin identificación", async () => {
  const html = await renderSummary("es", { paymentMethod: BANK_TRANSFER });
  assert.equal((html.match(/aria-expanded="true"/g) ?? []).length, 4);
  assert.match(html, /identification-number/);
  assert.match(html, /<button[^>]* disabled=""/);
});

test("el resumen bloquea el pago sin datos del comprador", async () => {
  assert.match(
    await renderSummary("es", { buyerName: "", buyerEmail: "" }),
    /<button[^>]* disabled=""/,
  );
});
