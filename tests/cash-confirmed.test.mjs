import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { CashConfirmed } from "../src/features/checkout/CashConfirmed.tsx";

for (const locale of ["es", "en"]) {
  for (const receivedAt of [null, "2026-09-18T12:00:00Z"]) {
    test(`efectivo confirmado ${locale}, recepción ${Boolean(receivedAt)}`, async () => {
      const messages = JSON.parse(
        await readFile(`messages/${locale}.json`, "utf8"),
      );
      const html = renderToStaticMarkup(
        createElement(
          NextIntlClientProvider,
          { locale, messages, timeZone: "UTC" },
          createElement(CashConfirmed, {
            reference: "00000000-0000-4000-8000-000000000001",
            receivedAt,
            summary: createElement("p", null, "Resumen de prueba"),
          }),
        ),
      );
      assert.ok(html.includes(messages.checkout.cashConfirmed.title));
      assert.ok(html.includes("Resumen de prueba"));
      assert.ok(!html.includes('form="cash-receipt-confirmation"'));
      assert.ok(html.includes("<form"));
      assert.ok(html.includes(messages.orders.receipt.submitFeedback));
      assert.ok(html.includes(messages.orders.receipt.skip));
      assert.ok(!html.includes("/staff/cash"));
      assert.ok(
        html.includes(
          `href="/${locale}/${locale === "es" ? "mis-pedidos" : "orders"}"`,
        ),
      );
    });
  }
}
