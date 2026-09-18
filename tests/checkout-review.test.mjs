import assert from "node:assert/strict";
import { test } from "node:test";
import { createCheckoutSession } from "../src/features/checkout/api.ts";
import {
  checkoutReviewSnapshot,
  hasCheckoutReview,
} from "../src/lib/checkout/review.ts";

test("no inicia el pedido sin revisión y aceptación explícita", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return Response.json({ session: {} });
  };
  try {
    await assert.rejects(
      createCheckoutSession({ cartId: "example", locale: "es" }),
      /Revisá/,
    );
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = original;
  }
});

test("la revisión cambia con cantidad, importe y entrega, sin incluir credenciales", () => {
  const amount = { amount: "20000", currencyCode: "ARS" };
  const cart = {
    id: "private-cart-secret",
    fulfillmentMode: "local_collection",
    cost: { subtotalAmount: amount, totalAmount: amount, totalTaxAmount: null },
    lines: [
      {
        id: "line",
        quantity: 1,
        merchandise: { id: "product" },
        cost: { amountPerQuantity: amount, totalAmount: amount },
      },
    ],
  };
  const snapshot = checkoutReviewSnapshot(cart);
  assert.ok(!snapshot.includes(cart.id));
  assert.notEqual(
    snapshot,
    checkoutReviewSnapshot({ ...cart, fulfillmentMode: "delivery" }),
  );
  assert.notEqual(
    snapshot,
    checkoutReviewSnapshot({
      ...cart,
      lines: [{ ...cart.lines[0], quantity: 2 }],
    }),
  );
  assert.notEqual(
    snapshot,
    checkoutReviewSnapshot({
      ...cart,
      cost: { ...cart.cost, totalAmount: { ...amount, amount: "21000" } },
    }),
  );
  for (const acceptedTerms of [false, undefined, "true", 1])
    assert.equal(
      hasCheckoutReview({ acceptedTerms, reviewedCart: snapshot }),
      false,
    );
  assert.equal(
    hasCheckoutReview({ acceptedTerms: true, reviewedCart: snapshot }),
    true,
  );
});

test("solo envía el checkout confirmado con la revisión mostrada", async () => {
  const original = globalThis.fetch;
  let sent;
  globalThis.fetch = async (_url, options) => {
    sent = JSON.parse(options.body);
    return Response.json({ session: { redirectUrl: "/pending" } });
  };
  try {
    await createCheckoutSession({
      cartId: "cart",
      locale: "en",
      acceptedTerms: true,
      reviewedCart: "snapshot",
      paymentMethod: "cash",
    });
    assert.equal(sent.acceptedTerms, true);
    assert.equal(sent.reviewedCart, "snapshot");
  } finally {
    globalThis.fetch = original;
  }
});
