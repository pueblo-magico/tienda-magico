import type { FulfillmentMode } from "@/types/commerce";
import { DELIVERY, LOCAL_COLLECTION } from "./local-purchase";

export type CommerceSettings = {
  localCollectionEnabled: boolean;
  deliveryEnabled: boolean;
};

export const DEFAULT_COMMERCE_SETTINGS: CommerceSettings = {
  localCollectionEnabled: true,
  deliveryEnabled: false,
};

export function parseCommerceSettings(value: unknown): CommerceSettings {
  if (!value || typeof value !== "object") return DEFAULT_COMMERCE_SETTINGS;

  const settings = value as Record<string, unknown>;
  return {
    localCollectionEnabled:
      typeof settings.localCollectionEnabled === "boolean"
        ? settings.localCollectionEnabled
        : DEFAULT_COMMERCE_SETTINGS.localCollectionEnabled,
    deliveryEnabled:
      typeof settings.deliveryEnabled === "boolean"
        ? settings.deliveryEnabled
        : DEFAULT_COMMERCE_SETTINGS.deliveryEnabled,
  };
}

export function isFulfillmentModeEnabled(
  mode: FulfillmentMode,
  settings: CommerceSettings,
): boolean {
  return mode === LOCAL_COLLECTION
    ? settings.localCollectionEnabled
    : mode === DELIVERY && settings.deliveryEnabled;
}
