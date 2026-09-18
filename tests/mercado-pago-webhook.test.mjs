import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { receiveMercadoPagoWebhook } from "../src/lib/checkout/providers/mercado-pago/webhook.ts";

const secret = "clave-ficticia-solo-pruebas";
const config = { secret, accessToken: "token-ficticio", sandbox: true };
function request({
  signature = true,
  id = "123",
  bodyID = id,
  type = "payment",
} = {}) {
  const timestamp = "1789550000000";
  const digest = createHmac("sha256", secret)
    .update(`id:${id};request-id:request-test;ts:${timestamp};`)
    .digest("hex");
  return new Request(
    `https://shop.example/api/webhook?data.id=${id}&type=${type}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-request-id": "request-test",
        ...(signature ? { "x-signature": `ts=${timestamp},v1=${digest}` } : {}),
      },
      body: JSON.stringify({
        type,
        data: { id: bodyID },
        id: "notification-not-payment",
      }),
    },
  );
}

test("rechaza notificaciones sin firma antes de consultar o persistir", async () => {
  const response = await receiveMercadoPagoWebhook(
    request({ signature: false }),
    {
      config,
      fetch: () => assert.fail("No debe consultar Mercado Pago"),
      record: () => assert.fail("No debe persistir"),
    },
  );
  assert.equal(response.status, 401);
});

const payment = {
  id: 123,
  collector_id: 456,
  live_mode: false,
  status: "approved",
  transaction_amount: 12.34,
  currency_id: "ARS",
  date_last_updated: "2026-09-16T12:00:00Z",
  external_reference: "b2e7712b-b011-4d3e-b4fa-2eebf02a2cf6",
  payer: { email: "privado@example.test" },
};
function dependencies(overrides = {}) {
  const recorded = [];
  return {
    config,
    recorded,
    fetch: async (url, options) => {
      assert.equal(options.redirect, "error");
      assert.equal(options.cache, "no-store");
      assert.ok(options.signal);
      assert.equal(options.headers.Authorization, "Bearer token-ficticio");
      return Response.json(
        url.endsWith("/users/me") ? { id: 456 } : { ...payment, ...overrides },
      );
    },
    record: async (value) => {
      recorded.push(value);
    },
  };
}

test("consulta el recurso firmado y guarda solo la proyección privada antes de responder", async () => {
  const deps = dependencies();
  const response = await receiveMercadoPagoWebhook(request(), deps);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { received: true });
  assert.equal(deps.recorded.length, 1);
  assert.equal(deps.recorded[0].amount, 1234);
  assert.equal(deps.recorded[0].resourceId, "123");
  assert.equal(deps.recorded[0].publicReference, payment.external_reference);
  assert.equal(JSON.stringify(deps.recorded).includes("privado"), false);
  assert.match(deps.recorded[0].idempotencyKey, /^[a-f0-9]{64}$/);
});

test("extrae documento y descripción únicamente del recurso verificado", async () => {
  const deps = dependencies({
    external_reference: null,
    description: payment.external_reference,
    payer: {
      identification: { type: "DNI", number: "1.111.111" },
      email: "privado@example.test",
    },
    payment_type_id: "bank_transfer",
    status_detail: "accredited",
    transaction_amount_refunded: 0,
    date_approved: payment.date_last_updated,
  });
  assert.equal((await receiveMercadoPagoWebhook(request(), deps)).status, 200);
  assert.equal(deps.recorded[0].payerNumber, "1111111");
  assert.equal(deps.recorded[0].payerType, "DNI");
  assert.equal(deps.recorded[0].publicReference, payment.external_reference);
  assert.equal(deps.recorded[0].refundedAmount, 0);
  assert.equal(deps.recorded[0].paymentType, "bank_transfer");
  assert.equal(JSON.stringify(deps.recorded).includes("privado"), false);
});

test("referencias contradictorias impiden la acreditación automática", async () => {
  const deps = dependencies({
    description: "00000000-0000-4000-8000-000000000001",
    status_detail: "accredited",
  });
  assert.equal((await receiveMercadoPagoWebhook(request(), deps)).status, 200);
  assert.equal(deps.recorded[0].statusDetail, null);
});

test("reintentos tienen la misma clave y una actualización tiene otra", async () => {
  const deps = dependencies();
  await receiveMercadoPagoWebhook(request(), deps);
  await receiveMercadoPagoWebhook(request(), deps);
  assert.equal(
    deps.recorded[0].idempotencyKey,
    deps.recorded[1].idempotencyKey,
  );
  const updated = dependencies({ status: "refunded" });
  await receiveMercadoPagoWebhook(request(), updated);
  assert.notEqual(
    deps.recorded[0].idempotencyKey,
    updated.recorded[0].idempotencyKey,
  );
});

test("rechaza firma alterada, ID contradictorio, tópicos desconocidos y cuerpos inválidos", async () => {
  const tampered = request();
  tampered.headers.set("x-signature", `ts=1789550000000,v1=${"0".repeat(64)}`);
  for (const [input, status] of [
    [tampered, 401],
    [request({ bodyID: "999" }), 400],
    [request({ type: "transfer" }), 422],
  ]) {
    const deps = dependencies();
    deps.fetch = () => assert.fail("No debe consultar");
    assert.equal((await receiveMercadoPagoWebhook(input, deps)).status, status);
  }
  for (const body of [
    "{",
    JSON.stringify({
      data: { id: "123" },
      type: "payment",
      padding: "x".repeat(17000),
    }),
  ]) {
    const signed = request();
    const input = new Request(signed.url, {
      method: "POST",
      headers: signed.headers,
      body,
    });
    assert.equal(
      (await receiveMercadoPagoWebhook(input, dependencies())).status,
      400,
    );
  }
});

test("no reconoce recepción cuando falta configuración, falla proveedor o falla persistencia", async () => {
  for (const failure of ["config", "fetch", "record"]) {
    const deps = dependencies();
    if (failure === "config") deps.config = { ...config, secret: "" };
    else
      deps[failure] = async () => {
        throw new Error("secreto que no debe salir");
      };
    const response = await receiveMercadoPagoWebhook(request(), deps);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { received: false });
  }
});

test("valida titular, ambiente, ID, importes y fecha consultados", async () => {
  for (const change of [
    { collector_id: 999 },
    { collector_id: null },
    { live_mode: true },
    { id: 999 },
    { transaction_amount: 1.234 },
    { transaction_amount: 0.000000001 },
    { transaction_amount: -1 },
    { transaction_amount: "12.34" },
    { transaction_amount: Number.MAX_SAFE_INTEGER },
    { date_last_updated: "inválida" },
    { currency_id: "ars" },
    { currency_id: "USD" },
    { status: null },
  ]) {
    const deps = dependencies(change);
    assert.equal(
      (await receiveMercadoPagoWebhook(request(), deps)).status,
      502,
    );
    assert.equal(deps.recorded.length, 0);
  }
});

test("no conserva referencias que contienen credenciales de carrito o datos personales", async () => {
  for (const reference of [
    "1::secreto",
    "12345678",
    "persona@example.test",
    null,
  ]) {
    const deps = dependencies({ external_reference: reference });
    assert.equal(
      (await receiveMercadoPagoWebhook(request(), deps)).status,
      200,
    );
    assert.equal(deps.recorded[0].publicReference, null);
  }
});
