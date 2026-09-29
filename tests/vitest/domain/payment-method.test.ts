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

  test("rechaza una transferencia habilitada pero incompleta", () => {
    const settings = {
      ...DEFAULT_COMMERCE_SETTINGS,
      transferEnabled: true,
    };

    expect(() => parsePaymentMethod(BANK_TRANSFER, settings, "en")).toThrow(
      "Bank transfer is not configured yet.",
    );
  });
});
