import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LOCAL_COLLECTION,
  DELIVERY,
  localSaleIdempotencyKey,
  parseFulfillmentMode,
} from "../src/lib/commerce/local-purchase.ts";
import { mapCart } from "../src/lib/commerce/providers/payload-ecommerce/mappers.ts";
import { mapCart as mapShopifyCart } from "../src/lib/commerce/providers/shopify/mappers.ts";
import { cartsCollectionOverride } from "../apps/cms/src/collections/cartCommercialValidation.ts";
import { LocalSales } from "../apps/cms/src/collections/LocalSales.ts";

process.env.PAYLOAD_ECOMMERCE_URL = "http://cms.test";
process.env.PAYLOAD_ECOMMERCE_CURRENCY = "ARS";
process.env.PAYLOAD_ECOMMERCE_AMOUNT_IS_CENTS = "true";

test("accepts the two explicit fulfillment modes", () => {
  assert.equal(parseFulfillmentMode(LOCAL_COLLECTION), LOCAL_COLLECTION);
  assert.equal(parseFulfillmentMode(DELIVERY), DELIVERY);
});

test("rejects an omitted or unknown fulfillment mode", () => {
  for (const value of [undefined, null, "pickup", "local", ""]) {
    assert.throws(() => parseFulfillmentMode(value), /fulfillment mode/i);
  }
});

test("derives one stable local-sale idempotency key from an order", () => {
  assert.equal(localSaleIdempotencyKey("order-123"), "local-sale:order-123");
  assert.equal(localSaleIdempotencyKey(" order-123 "), "local-sale:order-123");
  assert.throws(() => localSaleIdempotencyKey(""), /order/i);
});

test("maps the persisted fulfillment mode without inventing a default", () => {
  const cart = {
    id: 7,
    currency: "ARS",
    fulfillmentMode: LOCAL_COLLECTION,
    items: [],
  };

  assert.equal(mapCart(cart).fulfillmentMode, LOCAL_COLLECTION);
  assert.equal(
    mapCart({ ...cart, fulfillmentMode: null }).fulfillmentMode,
    null,
  );
  assert.throws(
    () => mapCart({ ...cart, fulfillmentMode: "pickup" }),
    /fulfillment mode/i,
  );
});

test("Shopify maps its cart attribute to the same fulfillment contract", () => {
  const cart = mapShopifyCart({
    id: "gid://shopify/Cart/1",
    checkoutUrl: "https://shop.test/checkout",
    attributes: [{ key: "fulfillment_mode", value: DELIVERY }],
  });

  assert.equal(cart.fulfillmentMode, DELIVERY);
});

test("the CMS cart schema persists only the supported fulfillment modes", () => {
  const collection = cartsCollectionOverride({
    defaultCollection: { fields: [] },
  });
  const field = collection.fields.find(
    (candidate) => candidate.name === "fulfillmentMode",
  );

  assert.deepEqual(field?.options, [
    { label: { es: "Retiro local", en: "Local collection" }, value: LOCAL_COLLECTION },
    { label: { es: "Entrega", en: "Delivery" }, value: DELIVERY },
  ]);
  assert.equal(field?.required, false);
});

test("checkout cannot finalize a cart without an explicit fulfillment mode", async () => {
  const { validateFulfillmentModeForCheckout } = await import(
    "../src/lib/commerce/local-purchase.ts"
  );

  assert.equal(
    validateFulfillmentModeForCheckout(LOCAL_COLLECTION),
    LOCAL_COLLECTION,
  );
  assert.throws(
    () => validateFulfillmentModeForCheckout(null),
    /fulfillment mode/i,
  );
});

test("the local-sale collection stores an order-linked operational snapshot privately", () => {
  const fields = LocalSales.fields.filter((field) => "name" in field);
  const names = new Set(fields.map((field) => field.name));

  for (const name of [
    "order",
    "idempotencyKey",
    "status",
    "fulfillmentMode",
    "paymentStatus",
    "snapshot",
  ]) {
    assert.ok(names.has(name), `missing local-sale field: ${name}`);
  }
  assert.equal(LocalSales.access?.read?.({ req: { user: null } }), false);
});
