// @vitest-environment node

import { describe, expect, test } from "vitest";
import {
  DEFAULT_COMMERCE_SETTINGS,
  isBankTransferAvailable,
  isFulfillmentModeEnabled,
  parseCommerceSettings,
} from "@/lib/commerce/commerce-settings";
import { DELIVERY, LOCAL_COLLECTION } from "@/lib/commerce/local-purchase";

describe("parseCommerceSettings", () => {
  test.each([undefined, null, false, "configuración inválida"])(
    "usa los valores predeterminados para %j",
    (value) => {
      expect(parseCommerceSettings(value)).toBe(DEFAULT_COMMERCE_SETTINGS);
    },
  );

  test("normaliza opciones, datos bancarios y ventana de pago", () => {
    expect(
      parseCommerceSettings({
        localCollectionEnabled: false,
        deliveryEnabled: true,
        cashEnabled: true,
        cashStaffEnabled: true,
        transferEnabled: true,
        transfer: {
          accountHolder: "  Pueblo Mágico  ",
          taxId: 123,
          alias: "  pueblo.magico  ",
          cvu: "  0000000000000000000000  ",
          paymentWindowMinutes: "30",
        },
      }),
    ).toEqual({
      localCollectionEnabled: false,
      deliveryEnabled: true,
      cashEnabled: true,
      cashStaffEnabled: true,
      transferEnabled: true,
      transfer: {
        accountHolder: "Pueblo Mágico",
        taxId: "",
        alias: "pueblo.magico",
        cvu: "0000000000000000000000",
        paymentWindowMinutes: 30,
      },
    });
  });

  test.each([0, 1.5, 1441, "no-numérico"])(
    "restaura una ventana de pago inválida: %j",
    (paymentWindowMinutes) => {
      const settings = parseCommerceSettings({
        transfer: { paymentWindowMinutes },
      });

      expect(settings.transfer.paymentWindowMinutes).toBe(15);
    },
  );
});

describe("disponibilidad de opciones comerciales", () => {
  const transferSettings = {
    ...DEFAULT_COMMERCE_SETTINGS,
    transferEnabled: true,
    transfer: {
      ...DEFAULT_COMMERCE_SETTINGS.transfer,
      accountHolder: "Pueblo Mágico",
      alias: "pueblo.magico",
    },
  };

  test("requiere titular y alias o CVU para transferencias", () => {
    expect(isBankTransferAvailable(transferSettings)).toBe(true);
    expect(
      isBankTransferAvailable({
        ...transferSettings,
        transfer: { ...transferSettings.transfer, alias: "", cvu: "123" },
      }),
    ).toBe(true);
    expect(
      isBankTransferAvailable({
        ...transferSettings,
        transfer: { ...transferSettings.transfer, accountHolder: "" },
      }),
    ).toBe(false);
    expect(
      isBankTransferAvailable({
        ...transferSettings,
        transferEnabled: false,
      }),
    ).toBe(false);
  });

  test("evalúa retiro y entrega de forma independiente", () => {
    const settings = {
      ...DEFAULT_COMMERCE_SETTINGS,
      localCollectionEnabled: false,
      deliveryEnabled: true,
    };

    expect(isFulfillmentModeEnabled(LOCAL_COLLECTION, settings)).toBe(false);
    expect(isFulfillmentModeEnabled(DELIVERY, settings)).toBe(true);
  });
});
