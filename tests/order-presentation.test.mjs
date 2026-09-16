import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { OrderList } from "../src/features/orders/OrderList.tsx";
import * as presentation from "../src/features/orders/presentation.ts";

const order = {
  publicReference: "order-1",
  paymentMethod: "bank-transfer",
  paymentStatus: "pending",
  paymentExpiresAt: "2026-09-15T12:00:00Z",
};
const now = Date.parse("2026-09-15T13:00:00Z");

for (const locale of ["es", "en"]) {
  test(`las tarjetas conservan referencia, importe y enlace localizado (${locale})`, async () => {
    const messages = JSON.parse(
      await readFile(
        new URL(`../messages/${locale}.json`, import.meta.url),
        "utf8",
      ),
    );
    const html = renderToStaticMarkup(
      createElement(
        NextIntlClientProvider,
        { locale, messages, timeZone: "UTC" },
        createElement(OrderList, {
          serverTime: now,
          orders: [
            {
              ...order,
              id: "1",
              total: { amount: "70000", currencyCode: "ARS" },
              newerReference: "order-2",
            },
          ],
        }),
      ),
    );
    assert.ok(html.includes(messages.orders.states.expired));
    assert.ok(html.includes("order-1"));
    assert.ok(html.includes("order-2"));
    assert.ok(
      html.includes(
        `/${locale}/checkout/pending?payment_method=bank-transfer&amp;order=order-1&amp;from=orders`,
      ),
    );
    assert.ok(html.includes(messages.orders.copy));
    assert.ok(html.includes('data-slot="card"'));
    assert.ok(!html.includes("orders.support"));
  });
}

test("el historial distingue vencimiento y transferencia declarada", () => {
  assert.equal(presentation.orderDisplayState(order, now), "expired");
  assert.equal(
    presentation.orderDisplayState(
      { ...order, transferReportedAt: "2026-09-15T12:30:00Z" },
      now,
    ),
    "reported",
  );
  assert.equal(
    presentation.orderDisplayState(
      {
        ...order,
        paymentStatus: "approved",
        transferReportedAt: "2026-09-15T12:30:00Z",
      },
      now,
    ),
    "approved",
  );
});

test("filtra solo estados reales de pago sin inventar estados de entrega", () => {
  const orders = [
    order,
    { ...order, publicReference: "order-2", paymentStatus: "approved" },
  ];
  assert.equal(presentation.filterOrders(orders, "all", now).length, 2);
  assert.deepEqual(
    presentation
      .filterOrders(orders, "approved", now)
      .map((item) => item.publicReference),
    ["order-2"],
  );
  assert.equal(presentation.filterOrders(orders, "pending", now).length, 0);
  assert.equal(presentation.filterOrders(orders, "expired", now).length, 1);
});
