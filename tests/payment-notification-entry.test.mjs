import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

test("el punto de entrada deja el cuerpo intacto para el verificador y no registra datos privados", async (context) => {
  const previous = { ...process.env };
  context.after(() => {
    process.env = previous;
  });
  process.env.MERCADOPAGO_ACCESS_TOKEN = "TEST-ficticio";
  process.env.MERCADOPAGO_WEBHOOK_SECRET = "firma-ficticia";
  const logs = [];
  context.mock.method(console, "debug", (...args) => logs.push(args));
  context.mock.method(console, "log", (...args) => logs.push(args));
  let lookups = 0;
  context.mock.method(globalThis, "fetch", async () => {
    lookups++;
    return Response.json({}, { status: 404 });
  });
  const persistence =
    "data:text/javascript," +
    encodeURIComponent(
      "export async function recordPaymentNotification() { throw new Error('No debe persistir un pago inexistente'); }",
    );
  const adapter = new URL(
    "../src/lib/checkout/providers/mercado-pago/webhook.ts",
    import.meta.url,
  ).href;
  const source = (
    await readFile(
      new URL("../src/lib/checkout/receive-notification.ts", import.meta.url),
      "utf8",
    )
  )
    .replace('"@/lib/commerce"', JSON.stringify(persistence))
    .replace('"./providers/mercado-pago/webhook"', JSON.stringify(adapter));
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const { receivePaymentNotification } = await import(
    "data:text/javascript," + encodeURIComponent(compiled.outputText)
  );
  const timestamp = "1789596511";
  const signature = createHmac("sha256", process.env.MERCADOPAGO_WEBHOOK_SECRET)
    .update(`id:123456;request-id:regression;ts:${timestamp};`)
    .digest("hex");
  const response = await receivePaymentNotification(
    new Request(
      "https://shop.example/api/checkout/webhooks/mercado-pago?data.id=123456&type=payment",
      {
        method: "POST",
        headers: {
          "x-request-id": "regression",
          "x-signature": `ts=${timestamp},v1=${signature}`,
        },
        body: JSON.stringify({ type: "payment", data: { id: "123456" } }),
      },
    ),
  );
  assert.equal(
    response.status,
    503,
    "Debe llegar al proveedor, no fallar por una segunda lectura del cuerpo",
  );
  assert.equal(lookups, 2);
  assert.equal(logs.length, 0);
});
