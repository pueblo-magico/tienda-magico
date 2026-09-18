import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime.js";
import { CashWaiting } from "../src/features/checkout/CashWaiting.tsx";

for (const locale of ["es", "en"]) {
  test(`efectivo vencido ${locale}: muestra reintento, no ofrece cobro`, async () => {
    const messages = JSON.parse(
      await readFile(`messages/${locale}.json`, "utf8"),
    );
    const html = renderToStaticMarkup(
      createElement(
        NextIntlClientProvider,
        { locale, messages, timeZone: "UTC" },
        createElement(
          AppRouterContext.Provider,
          { value: { refresh() {} } },
          createElement(CashWaiting, {
            paymentStatus: "pending",
            cashStaffEnabled: true,
            reference: "00000000-0000-4000-8000-000000000001",
            expiresAt: "2026-09-18T12:00:00Z",
            serverTime: Date.parse("2026-09-18T12:00:00Z"),
            title: "",
            body: "",
            notice: "",
            children: "Referencia",
          }),
        ),
      ),
    );
    assert.ok(html.includes(messages.orders.states.expired));
    assert.ok(html.includes(messages.checkout.cashWaiting.expiredBody));
    assert.ok(html.includes(messages.checkout.transferWaiting.retry));
    assert.ok(html.includes(messages.checkout.cashWaiting.cancel));
    assert.ok(!html.includes("/staff/cash?order="));
    assert.ok(!html.includes(messages.checkout.cashWaiting.nextTitle));
  });
}

for (const cashStaffEnabled of [true, false, undefined]) {
  for (const locale of ["es", "en"]) {
    for (const paymentStatus of [
      "pending",
      "approved",
      "cancelled",
      "rejected",
      "unverified",
    ]) {
      test(`efectivo ${locale}, caja ${cashStaffEnabled}: presenta el estado ${paymentStatus} sin volver a pedir un pago confirmado`, async () => {
        const messages = JSON.parse(
          await readFile(
            new URL(`../messages/${locale}.json`, import.meta.url),
          ),
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
                  cashStaffEnabled,
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
          html.includes(
            `/staff/cash?order=00000000-0000-4000-8000-000000000001`,
          ),
          canRefresh && cashStaffEnabled === true,
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
        assert.equal(
          html.includes(messages.checkout.cashWaiting.nextTitle),
          paymentStatus === "pending",
        );
        assert.ok(html.includes(messages.checkout.cashWaiting.summaryTitle));
        assert.ok(html.includes(messages.checkout.cashWaiting.paymentMethod));
        assert.equal(
          html.includes(messages.orders.receipt.confirm),
          paymentStatus === "approved",
        );
        if (paymentStatus !== "pending") {
          assert.ok(
            html.includes(
              messages.checkout.cashWaiting[`${paymentStatus}Body`],
            ),
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
}

test("un pedido en efectivo recibido no vuelve a mostrar el formulario de recepción", async () => {
  const messages = JSON.parse(await readFile("messages/es.json", "utf8"));
  const html = renderToStaticMarkup(
    createElement(
      NextIntlClientProvider,
      { locale: "es", messages, timeZone: "UTC" },
      createElement(
        AppRouterContext.Provider,
        { value: { refresh() {} } },
        createElement(CashWaiting, {
          paymentStatus: "approved",
          cashStaffEnabled: true,
          reference: "00000000-0000-4000-8000-000000000001",
          receivedAt: "2026-09-17T12:00:00.000Z",
          title: messages.checkout.pending.cashTitle,
          body: messages.checkout.pending.cashBody,
          notice: messages.checkout.pending.cashNotice,
          children: "Referencia",
        }),
      ),
    ),
  );
  assert.ok(!html.includes(messages.orders.receipt.confirm));
  assert.ok(!html.includes("/staff/cash?order="));
});
