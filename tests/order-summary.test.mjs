import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { readFile } from "node:fs/promises";
import { OrderSummary } from "../src/features/orders/OrderSummary.tsx";
import { normalizePayloadOrderResponse } from "../src/lib/commerce/providers/payload-ecommerce/orders.ts";

test("el detalle privado usa el precio histórico y descarta filas inválidas", (context) => {
  const previousUrl = process.env.PAYLOAD_ECOMMERCE_URL;
  process.env.PAYLOAD_ECOMMERCE_URL = "https://cms.example";
  context.after(() => {
    if (previousUrl === undefined) delete process.env.PAYLOAD_ECOMMERCE_URL;
    else process.env.PAYLOAD_ECOMMERCE_URL = previousUrl;
  });
  const raw = {
    id: 1,
    publicReference: "abcd1234-1111-4111-8111-111111111111",
    amount: 20000,
    currency: "ARS",
    commercialSnapshot: {
      items: [
        {
          title: "Taza",
          quantity: 2,
          total: { amount: "200", currencyCode: "ARS" },
        },
        { title: "Inválido", quantity: -1 },
      ],
    },
  };
  assert.equal(normalizePayloadOrderResponse(raw).items, undefined);
  const order = normalizePayloadOrderResponse(raw, true);
  assert.equal(order.items.length, 1);
  assert.equal(order.items[0].total.amount, "200");
  assert.equal(order.items[0].quantity, 2);
  const illustrated = normalizePayloadOrderResponse(
    {
      ...raw,
      items: [
        {
          product: {
            id: 7,
            featuredImage: { url: "https://example.com/cup.jpg", alt: "Taza" },
          },
        },
      ],
      commercialSnapshot: {
        items: [
          {
            productId: "7",
            title: "Taza histórica",
            quantity: 1,
            total: { amount: "200", currencyCode: "ARS" },
          },
        ],
      },
    },
    true,
  );
  assert.equal(illustrated.items[0].image?.url, "https://example.com/cup.jpg");
});

for (const locale of ["es", "en"]) {
  test(`resumen ${locale}: referencia abreviada y total según estado`, async () => {
    const messages = JSON.parse(
      await readFile(`messages/${locale}.json`, "utf8"),
    );
    for (const paymentStatus of ["pending", "approved"]) {
      const html = renderToStaticMarkup(
        createElement(
          NextIntlClientProvider,
          { locale, messages, timeZone: "UTC" },
          createElement(OrderSummary, {
            order: {
              id: "1",
              publicReference: "abcd1234-1111-4111-8111-111111111111",
              paymentStatus,
              paymentMethod: "cash",
              total: { amount: "200", currencyCode: "ARS" },
              items: [
                {
                  title: "Taza histórica",
                  quantity: 2,
                  image: null,
                  total: { amount: "200", currencyCode: "ARS" },
                },
              ],
            },
          }),
        ),
      );
      assert.ok(html.includes("#ABCD1234"));
      assert.ok(html.includes("Taza histórica"));
      assert.ok(
        html.includes(
          messages.orders.summary[
            paymentStatus === "approved" ? "paid" : "total"
          ],
        ),
      );
      assert.ok(html.includes(messages.orders.copy));
      assert.ok(
        !html.includes("bg-background-secondary"),
        "El resumen no debe usar texto oscuro sobre fondo forest",
      );
      assert.ok(html.includes("bg-warm text-text-secondary"));
      const titleClass = html.match(/<h2[^>]*class="([^"]+)"/)?.[1] ?? "";
      assert.ok(titleClass.includes("font-normal"));
      assert.ok(!titleClass.includes("font-bold"));
      assert.ok(!titleClass.includes("text-base"));
    }
  });
}
