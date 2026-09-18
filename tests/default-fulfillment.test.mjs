import assert from "node:assert/strict";
import test from "node:test";
import { shouldDefaultToPickup } from "../src/features/cart/default-fulfillment.ts";

test("selecciona retiro solo para carritos sin elección cuando está habilitado", () => {
  assert.equal(
    shouldDefaultToPickup({ id: "cart", fulfillmentMode: null }, true),
    true,
  );
  assert.equal(
    shouldDefaultToPickup({ id: "cart", fulfillmentMode: "delivery" }, true),
    false,
  );
  assert.equal(
    shouldDefaultToPickup(
      { id: "cart", fulfillmentMode: "local_collection" },
      true,
    ),
    false,
  );
  assert.equal(
    shouldDefaultToPickup({ id: "cart", fulfillmentMode: null }, false),
    false,
  );
  assert.equal(
    shouldDefaultToPickup({ id: "", fulfillmentMode: null }, true),
    false,
  );
});
