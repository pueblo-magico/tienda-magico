import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime.js";
import { CashWaiting } from "../src/features/checkout/CashWaiting.tsx";

for (const locale of ["es", "en"]) {
  for (const paymentStatus of [
    "pending",
    "approved",
    "cancelled",
    "rejected",
    "unverified",
  ]) {
    test(`efectivo ${locale}: presenta el estado ${paymentStatus} sin volver a pedir un pago confirmado`, async () => {
      const messages = JSON.parse(
        await readFile(new URL(`../messages/${locale}.json`, import.meta.url)),
      );
      const html = renderToStaticMarkup(
        createElement(
          NextIntlClientProvider,
          { locale, messages, timeZone: "UTC" },
          createElement(
            AppRouterContext.Provider,
            { value: { refresh() {} } },
            createElement(
              CashWaiting,
              {
                paymentStatus,
                reference: "00000000-0000-4000-8000-000000000001",
                title: messages.checkout.pending.cashTitle,
                body: messages.checkout.pending.cashBody,
                notice: messages.checkout.pending.cashNotice,
              },
              "Referencia",
            ),
          ),
        ),
      );
      assert.match(html, new RegExp(messages.orders.states[paymentStatus]));
      const canRefresh = ["pending", "unverified"].includes(paymentStatus);
      assert.equal(
        html.includes(`/staff/cash?order=00000000-0000-4000-8000-000000000001`),
        canRefresh,
      );
      assert.equal(
        html.includes(messages.checkout.transferWaiting.check),
        canRefresh,
      );
      assert.match(
        html,
        new RegExp(
          `href="/${locale}/${locale === "es" ? "mis-pedidos" : "orders"}"`,
        ),
      );
      assert.match(html, /role="status" aria-live="polite"/);
      if (paymentStatus !== "pending") {
        assert.ok(
          html.includes(messages.checkout.cashWaiting[`${paymentStatus}Body`]),
        );
        assert.ok(!html.includes(messages.checkout.pending.cashNotice));
      }
      if (
        paymentStatus === "approved" ||
        paymentStatus === "cancelled" ||
        paymentStatus === "rejected"
      )
        assert.ok(!html.includes(messages.checkout.pending.cashBody));
    });
  }
}
