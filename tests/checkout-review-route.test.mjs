import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

test("el servidor rechaza términos ausentes y revisiones desactualizadas antes de crear pedidos", async (context) => {
  if (!process.execArgv.includes("--conditions=react-server")) {
    const result = spawnSync(
      process.execPath,
      [
        "--conditions=react-server",
        "--import",
        fileURLToPath(new URL("./register.mjs", import.meta.url)),
        "--test",
        fileURLToPath(import.meta.url),
      ],
      { encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stdout + result.stderr);
    return;
  }
  const { POST } = await import("../src/app/api/checkout/route.ts");
  const { commerce } = await import("../src/lib/commerce/index.ts");
  const money = { amount: "20000", currencyCode: "ARS" };
  const cart = {
    id: "test",
    fulfillmentMode: "local_collection",
    cost: { totalAmount: money, subtotalAmount: money, totalTaxAmount: null },
    lines: [
      {
        id: "line",
        quantity: 1,
        merchandise: { id: "product" },
        cost: { totalAmount: money, amountPerQuantity: money },
      },
    ],
  };
  context.mock.method(commerce, "isConfigured", () => true);
  context.mock.method(commerce, "getCart", async () => cart);
  let creations = 0;
  context.mock.method(commerce, "createCheckoutOrder", async () => {
    creations++;
    throw new Error("No debe crear pedidos");
  });
  const send = (body) =>
    POST(
      new Request("http://localhost:3000/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId: "test", locale: "es", ...body }),
      }),
    );
  assert.equal((await send({})).status, 400);
  assert.equal(
    (await send({ acceptedTerms: true, reviewedCart: "outdated" })).status,
    409,
  );
  assert.equal(creations, 0);
});
