import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { OrderList } from "../src/features/orders/OrderList.tsx";

for (const receivedAt of [null, "2026-09-18T12:00:00Z"]) {
  test(`opinión independiente de recepción ${receivedAt}`, async () => {
    const messages = JSON.parse(await readFile("messages/es.json", "utf8"));
    const html = renderToStaticMarkup(
      createElement(
        NextIntlClientProvider,
        { locale: "es", messages, timeZone: "UTC" },
        createElement(OrderList, {
          serverTime: 0,
          orders: [
            {
              id: "1",
              publicReference: "order-1",
              paymentMethod: "cash",
              paymentStatus: "approved",
              receivedAt,
              total: { amount: "100", currencyCode: "ARS" },
            },
          ],
        }),
      ),
    );
    assert.ok(html.includes(messages.orders.receipt.submitFeedback));
    const form = html.match(/<form\b[\s\S]*?<\/form>/)?.[0];
    assert.ok(form);
    assert.ok(!form.includes(messages.orders.receipt.confirm));
  });
}
