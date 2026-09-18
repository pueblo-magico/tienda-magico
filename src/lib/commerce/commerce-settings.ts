import type { FulfillmentMode } from "@/types/commerce";
import { DELIVERY, LOCAL_COLLECTION } from "./local-purchase";

export type CommerceSettings = {
  localCollectionEnabled: boolean;
  deliveryEnabled: boolean;
  cashEnabled: boolean;
  cashStaffEnabled: boolean;
  transferEnabled: boolean;
  transfer: {
    accountHolder: string;
    taxId: string;
    alias: string;
    cvu: string;
    paymentWindowMinutes: number;
  };
};

export const DEFAULT_COMMERCE_SETTINGS: CommerceSettings = {
  localCollectionEnabled: true,
  deliveryEnabled: false,
  cashEnabled: false,
  cashStaffEnabled: false,
  transferEnabled: false,
  transfer: {
    accountHolder: "",
    taxId: "",
    alias: "",
    cvu: "",
    paymentWindowMinutes: 15,
  },
};

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parseCommerceSettings(value: unknown): CommerceSettings {
  if (!value || typeof value !== "object") return DEFAULT_COMMERCE_SETTINGS;

  const settings = value as Record<string, unknown>;
  const transfer =
    settings.transfer && typeof settings.transfer === "object"
      ? (settings.transfer as Record<string, unknown>)
      : {};
  const paymentWindowMinutes = Number(transfer.paymentWindowMinutes);
  return {
    localCollectionEnabled:
      typeof settings.localCollectionEnabled === "boolean"
        ? settings.localCollectionEnabled
        : DEFAULT_COMMERCE_SETTINGS.localCollectionEnabled,
    deliveryEnabled:
      typeof settings.deliveryEnabled === "boolean"
        ? settings.deliveryEnabled
        : DEFAULT_COMMERCE_SETTINGS.deliveryEnabled,
    cashEnabled:
      typeof settings.cashEnabled === "boolean"
        ? settings.cashEnabled
        : DEFAULT_COMMERCE_SETTINGS.cashEnabled,
    transferEnabled:
      typeof settings.transferEnabled === "boolean"
        ? settings.transferEnabled
        : DEFAULT_COMMERCE_SETTINGS.transferEnabled,
    cashStaffEnabled: settings.cashStaffEnabled === true,
    transfer: {
      accountHolder: stringValue(transfer.accountHolder),
      taxId: stringValue(transfer.taxId),
      alias: stringValue(transfer.alias),
      cvu: stringValue(transfer.cvu),
      paymentWindowMinutes:
        Number.isInteger(paymentWindowMinutes) &&
        paymentWindowMinutes >= 1 &&
        paymentWindowMinutes <= 1440
          ? paymentWindowMinutes
          : DEFAULT_COMMERCE_SETTINGS.transfer.paymentWindowMinutes,
    },
  };
}

export function isBankTransferAvailable(settings: CommerceSettings): boolean {
  return (
    settings.transferEnabled &&
    settings.transfer.accountHolder.length > 0 &&
    (settings.transfer.alias.length > 0 || settings.transfer.cvu.length > 0)
  );
}

export function isFulfillmentModeEnabled(
  mode: FulfillmentMode,
  settings: CommerceSettings,
): boolean {
  return mode === LOCAL_COLLECTION
    ? settings.localCollectionEnabled
    : mode === DELIVERY && settings.deliveryEnabled;
}
