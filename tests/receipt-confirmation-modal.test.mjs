import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { ReceiptConfirmationModal } from "../src/features/orders/ReceiptConfirmationModal.tsx";
import { OrderSummary } from "../src/features/orders/OrderSummary.tsx";

for (const locale of ["es", "en"]) {
  test(`revisión de recepción muestra productos y referencia en ${locale}`, async () => {
    const messages = JSON.parse(
      await readFile(`messages/${locale}.json`, "utf8"),
    );
    const html = renderToStaticMarkup(
      createElement(
        NextIntlClientProvider,
        {
          locale,
          messages,
          timeZone: "UTC",
        },
        createElement(ReceiptConfirmationModal, {
          busy: true,
          failed: true,
          onClose() {},
          onConfirm() {},
          summary: createElement(OrderSummary, {
            order: {
              id: "1",
              publicReference: "abcdef12-0000-4000-8000-000000000001",
              paymentMethod: "cash",
              paymentStatus: "approved",
              total: { amount: "20000", currencyCode: "ARS" },
              items: [
                {
                  title: "Taza artesanal",
                  quantity: 2,
                  image: null,
                  total: { amount: "20000", currencyCode: "ARS" },
                },
              ],
            },
          }),
        }),
      ),
    );
    assert.ok(html.includes("Taza artesanal"));
    assert.ok(html.includes("#ABCDEF12"));
    assert.ok(html.includes(messages.orders.receiptConfirmation.warning));
    assert.ok(html.includes(messages.orders.receiptConfirmation.saving));
    assert.ok(html.includes('aria-busy="true"'));
    assert.ok(html.includes('role="alert"'));
    assert.ok(!html.includes("<form"));
  });
}
