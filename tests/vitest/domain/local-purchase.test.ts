// @vitest-environment node

import { describe, expect, test } from "vitest";
import {
  DELIVERY,
  FulfillmentModeError,
  LOCAL_COLLECTION,
  localSaleIdempotencyKey,
  parseFulfillmentMode,
  validateFulfillmentModeForCheckout,
} from "@/lib/commerce/local-purchase";

describe("modalidad de entrega", () => {
  test.each([LOCAL_COLLECTION, DELIVERY])("acepta %s", (mode) => {
    expect(parseFulfillmentMode(mode)).toBe(mode);
    expect(validateFulfillmentModeForCheckout(mode)).toBe(mode);
  });

  test("rechaza valores inválidos en español por defecto", () => {
    expect(() => parseFulfillmentMode("retiro")).toThrowError(
      new FulfillmentModeError(),
    );
  });

  test("localiza el error en inglés", () => {
    expect(() => parseFulfillmentMode(null, "EN-us")).toThrow(
      "Choose a valid fulfillment mode before checkout.",
    );
  });
});

describe("localSaleIdempotencyKey", () => {
  test("normaliza el identificador de la orden", () => {
    expect(localSaleIdempotencyKey("  order-123  ")).toBe(
      "local-sale:order-123",
    );
  });

  test("requiere un identificador no vacío", () => {
    expect(() => localSaleIdempotencyKey("   ")).toThrow(
      "An order ID is required for a local-sale idempotency key.",
    );
  });
});
