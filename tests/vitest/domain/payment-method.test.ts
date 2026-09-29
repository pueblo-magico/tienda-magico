// @vitest-environment node

import { describe, expect, test } from "vitest";
import {
  PaymentMethodError,
  parsePaymentMethod,
} from "@/lib/checkout/payment-method";
import { DEFAULT_COMMERCE_SETTINGS } from "@/lib/commerce/commerce-settings";
import { BANK_TRANSFER, CASH, MERCADO_PAGO } from "@/types/checkout";

describe("parsePaymentMethod", () => {
  test("mantiene Mercado Pago como opción predeterminada", () => {
    expect(parsePaymentMethod(undefined, DEFAULT_COMMERCE_SETTINGS)).toBe(
      MERCADO_PAGO,
    );
  });

  test("acepta efectivo únicamente para retiro local habilitado", () => {
    const settings = { ...DEFAULT_COMMERCE_SETTINGS, cashEnabled: true };

    expect(parsePaymentMethod(CASH, settings, "es", "local_collection")).toBe(
      CASH,
    );
    expect(() =>
      parsePaymentMethod(CASH, settings, "es", "delivery"),
    ).toThrowError(
      new PaymentMethodError(
        "El pago en efectivo solo está disponible con retiro local.",
      ),
    );
  });

  test("rechaza efectivo deshabilitado con un mensaje localizado", () => {
    expect(() =>
      parsePaymentMethod(CASH, DEFAULT_COMMERCE_SETTINGS, "es-AR"),
    ).toThrow("El pago en efectivo no está habilitado.");
  });

  test("rechaza medios desconocidos", () => {
    expect(() =>
      parsePaymentMethod("crypto", DEFAULT_COMMERCE_SETTINGS, "en"),
    ).toThrowError(new PaymentMethodError("Choose a valid payment method."));
  });

  test("rechaza una transferencia deshabilitada", () => {
    expect(() =>
      parsePaymentMethod(BANK_TRANSFER, DEFAULT_COMMERCE_SETTINGS, "es"),
    ).toThrow("La transferencia no está habilitada.");
  });

  test("rechaza una transferencia habilitada pero incompleta", () => {
    const settings = {
      ...DEFAULT_COMMERCE_SETTINGS,
      transferEnabled: true,
    };

    expect(() => parsePaymentMethod(BANK_TRANSFER, settings, "en")).toThrow(
      "Bank transfer is not configured yet.",
    );
  });

  test("acepta una transferencia habilitada y configurada", () => {
    const settings = {
      ...DEFAULT_COMMERCE_SETTINGS,
      transferEnabled: true,
      transfer: {
        ...DEFAULT_COMMERCE_SETTINGS.transfer,
        accountHolder: "Pueblo Mágico",
        alias: "pueblo.magico",
      },
    };

    expect(parsePaymentMethod(BANK_TRANSFER, settings, "es")).toBe(
      BANK_TRANSFER,
    );
  });
});
