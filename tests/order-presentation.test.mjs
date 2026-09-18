import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { OrderList } from "../src/features/orders/OrderList.tsx";
import * as presentation from "../src/features/orders/presentation.ts";
import { buildWhatsAppUrl } from "../src/features/impact/whatsapp.ts";

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
        `/${locale}/${locale === "es" ? "pago/pendiente" : "checkout/pending"}?payment_method=bank-transfer&amp;order=order-1&amp;from=orders`,
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

test("un pedido aprobado pendiente de recepción muestra la acción de entrega", async () => {
  const messages = JSON.parse(
    await readFile(new URL("../messages/es.json", import.meta.url), "utf8"),
  );
  const html = renderToStaticMarkup(
    createElement(
      NextIntlClientProvider,
      { locale: "es", messages, timeZone: "UTC" },
      createElement(OrderList, {
        serverTime: now,
        orders: [
          {
            ...order,
            id: "1",
            paymentStatus: "approved",
            total: { amount: "70000", currencyCode: "ARS" },
          },
        ],
      }),
    ),
  );
  assert.ok(html.includes(messages.orders.receipt.inlineQuestion));
  assert.ok(html.includes(messages.orders.receipt.ratingLabel));
  assert.ok(html.includes(messages.orders.receipt.commentLabel));
});

test("un pedido recibido no vuelve a pedir confirmación", async () => {
  const messages = JSON.parse(
    await readFile(new URL("../messages/es.json", import.meta.url), "utf8"),
  );
  const html = renderToStaticMarkup(
    createElement(
      NextIntlClientProvider,
      { locale: "es", messages, timeZone: "UTC" },
      createElement(OrderList, {
        serverTime: now,
        orders: [
          {
            ...order,
            id: "1",
            paymentStatus: "approved",
            receivedAt: "2026-09-17T12:00:00.000Z",
            total: { amount: "70000", currencyCode: "ARS" },
          },
        ],
      }),
    ),
  );
  assert.ok(html.includes(messages.orders.receipt.received));
  assert.ok(!html.includes(messages.orders.receipt.confirm));
});

test("el contacto de soporte prepara un mensaje localizado para WhatsApp", async () => {
  const [page, messagesEs, messagesEn] = await Promise.all([
    readFile("src/app/[locale]/orders/page.tsx", "utf8"),
    readFile("messages/es.json", "utf8").then(JSON.parse),
    readFile("messages/en.json", "utf8").then(JSON.parse),
  ]);

  assert.equal(
    buildWhatsAppUrl("+54 9 11 2345-6789", messagesEs.orders.supportMessage),
    "https://wa.me/5491123456789?text=Hola%20Pueblo%20M%C3%A1gico%2C%20quiero%20pedir%20informaci%C3%B3n%20sobre%20mi%20pedido.%20Mi%20referencia%20es%3A%20",
  );
  assert.equal(
    buildWhatsAppUrl("+54 9 11 2345-6789", messagesEn.orders.supportMessage),
    "https://wa.me/5491123456789?text=Hello%20Pueblo%20M%C3%A1gico%2C%20I'd%20like%20to%20request%20information%20about%20my%20order.%20My%20order%20reference%20is%3A%20",
  );
  assert.match(page, /buildWhatsAppUrl/);
  assert.match(page, /settings\.contactPhone/);
  assert.match(page, /t\("supportMessage"\)/);
  assert.doesNotMatch(page, /experienciaMagicoUrl\("\/#contacto"\)/);
});
