import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../src/app/api/checkout/route.ts";
import { commerce } from "../src/lib/commerce/index.ts";

test("checkout rechaza otros orígenes antes de crear o vincular pedidos a la cuenta", async (context) => {
  context.mock.method(commerce, "isConfigured", () => true);
  const originalFetch = globalThis.fetch;
  let calls = 0;
  context.mock.method(commerce, "getCart", async () => {
    calls++;
    return null;
  });
  globalThis.fetch = async () => {
    calls++;
    throw new Error("No debe llamar al proveedor");
  };
  try {
    for (const origin of [undefined, "null", "https://other.example.test"]) {
      const response = await POST(
        new Request("https://shop.example.test/api/checkout", {
          method: "POST",
          headers: {
            cookie: "magico_customer=private-session",
            ...(origin ? { origin } : {}),
          },
          body: JSON.stringify({
            cartId: "other-cart",
            acceptedTerms: true,
            reviewedCart: "review",
          }),
        }),
      );
      assert.equal(response.status, 403);
      assert.deepEqual(await response.json(), { error: "forbidden" });
    }
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
