import assert from "node:assert/strict";
import test from "node:test";
import { recordPaymentNotification } from "../src/lib/commerce/providers/payload-ecommerce/payment-notifications.ts";

const notification = {
  idempotencyKey: "a".repeat(64),
  resourceId: "123",
  paymentStatus: "approved",
  amount: 1234,
  currency: "ARS",
  publicReference: null,
  liveMode: false,
  providerUpdatedAt: "2026-09-16T12:00:00.000Z",
};

test("la persistencia exige credencial y reconoce solo duplicados idénticos", async (context) => {
  const previous = { ...process.env };
  context.after(() => {
    process.env = previous;
  });
  process.env.PAYLOAD_ECOMMERCE_URL = "https://cms.example";
  process.env.PAYLOAD_ECOMMERCE_CURRENCY = "ARS";
  process.env.PAYLOAD_ECOMMERCE_AMOUNT_IS_CENTS = "true";
  process.env.PAYLOAD_ECOMMERCE_API_KEY = "";
  context.mock.method(globalThis, "fetch", async () =>
    assert.fail("Sin credenciales no consulta"),
  );
  await assert.rejects(recordPaymentNotification(notification));
  process.env.PAYLOAD_ECOMMERCE_API_KEY = "credencial-ficticia";
  for (const [existing, succeeds] of [
    [notification, true],
    [{ ...notification, amount: 9999 }, false],
    [undefined, false],
  ]) {
    const calls = [];
    globalThis.fetch = async (url, options) => {
      calls.push(String(url));
      assert.equal(options.redirect, "error");
      assert.ok(options.signal);
      assert.match(
        options.headers.Authorization,
        /API-Key credencial-ficticia$/,
      );
      return options.method === "POST"
        ? Response.json({}, { status: 400 })
        : Response.json({ docs: existing ? [existing] : [] });
    };
    if (succeeds) await recordPaymentNotification(notification);
    else await assert.rejects(recordPaymentNotification(notification));
    assert.equal(calls.length, 2);
    assert.equal(
      new URL(calls[1]).searchParams.get("where[idempotencyKey][equals]"),
      notification.idempotencyKey,
    );
  }
  globalThis.fetch = async () => Response.json({}, { status: 503 });
  await assert.rejects(recordPaymentNotification(notification));
  globalThis.fetch = async () => Response.json({}, { status: 200 });
  await assert.rejects(recordPaymentNotification(notification));
  globalThis.fetch = async () =>
    Response.json({ doc: notification }, { status: 201 });
  await recordPaymentNotification(notification);
});
