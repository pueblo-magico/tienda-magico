export const LOCAL_COLLECTION = "local_collection" as const;
export const DELIVERY = "delivery" as const;

export type FulfillmentMode = typeof LOCAL_COLLECTION | typeof DELIVERY;

export class FulfillmentModeError extends Error {
  constructor() {
    super("A valid fulfillment mode is required before checkout.");
    this.name = "FulfillmentModeError";
  }
}

const fulfillmentModes = new Set<FulfillmentMode>([
  LOCAL_COLLECTION,
  DELIVERY,
]);

export function parseFulfillmentMode(value: unknown): FulfillmentMode {
  if (typeof value === "string" && fulfillmentModes.has(value as FulfillmentMode)) {
    return value as FulfillmentMode;
  }

  throw new FulfillmentModeError();
}

export function validateFulfillmentModeForCheckout(
  value: unknown,
): FulfillmentMode {
  return parseFulfillmentMode(value);
}

export function localSaleIdempotencyKey(orderId: string): string {
  const normalizedOrderId = orderId.trim();
  if (!normalizedOrderId) {
    throw new Error("An order ID is required for a local-sale idempotency key.");
  }

  return `local-sale:${normalizedOrderId}`;
}
