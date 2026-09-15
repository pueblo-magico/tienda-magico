import assert from "node:assert/strict";
import { test } from "node:test";
import { buildShopifyProductQuery } from "@/lib/commerce/providers/shopify/products";

test("Shopify combina varias categorías con OR y la búsqueda con AND", () => {
  assert.equal(
    buildShopifyProductQuery({
      collections: ["cacao", "te"],
      query: "organico",
    }),
    "(collection:cacao OR collection:te) AND organico",
  );
});
