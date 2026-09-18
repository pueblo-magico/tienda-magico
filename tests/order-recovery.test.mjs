import assert from "node:assert/strict";
import { test } from "node:test";
import { createOrderRecovery } from "../src/features/orders/recovery.ts";

const reference = `1::${"a".repeat(40)}`;

test("recupera automáticamente una sola vez por carrito, incluso con solicitudes simultáneas", async (context) => {
  let calls = 0;
  context.mock.method(globalThis, "fetch", async (url, options) => {
    calls++;
    assert.equal(url, "/api/orders");
    assert.equal(options.method, "POST");
    assert.deepEqual(JSON.parse(options.body), { cartReference: reference });
    return new Response("{}", { status: 200 });
  });
  const recover = createOrderRecovery();
  assert.deepEqual(
    await Promise.all([recover(reference), recover(reference)]),
    ["recovered", "recovered"],
  );
  assert.equal(await recover(reference), "recovered");
  assert.equal(calls, 1);
});

test("no consulta carritos ausentes o sin credenciales válidas", async (context) => {
  context.mock.method(globalThis, "fetch", () => {
    throw new Error("No debe consultar");
  });
  const recover = createOrderRecovery();
  for (const id of ["", "1", "1::invalid", "shopify-cart"])
    assert.equal(await recover(id), "empty");
});

test("un carrito sin pedidos es normal; errores de red o servicio no se reintentan en bucle", async (context) => {
  let calls = 0;
  context.mock.method(globalThis, "fetch", async () => {
    calls++;
    if (calls === 1) return new Response("{}", { status: 404 });
    if (calls === 2) return new Response("{}", { status: 503 });
    throw new Error("offline");
  });
  const recover = createOrderRecovery();
  assert.equal(await recover(reference), "empty");
  const second = reference.replace("1::", "2::");
  assert.equal(await recover(second), "failed");
  assert.equal(await recover(second), "failed");
  assert.equal(await recover(reference.replace("1::", "3::")), "failed");
  assert.equal(calls, 3);
});
