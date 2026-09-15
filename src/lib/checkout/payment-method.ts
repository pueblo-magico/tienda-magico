import {
  isBankTransferAvailable,
  type CommerceSettings,
} from "@/lib/commerce/commerce-settings";
import {
  BANK_TRANSFER,
  MERCADO_PAGO,
  type PaymentMethod,
} from "@/types/checkout";

export class PaymentMethodError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentMethodError";
  }
}

function message(locale: string | null | undefined, es: string, en: string) {
  return locale?.toLowerCase().startsWith("es") ? es : en;
}

export function parsePaymentMethod(
  value: unknown,
  settings: CommerceSettings,
  locale?: string | null,
): PaymentMethod {
  const method = value == null || value === "" ? MERCADO_PAGO : value;

  if (method === MERCADO_PAGO) return MERCADO_PAGO;

  if (method !== BANK_TRANSFER) {
    throw new PaymentMethodError(
      message(
        locale,
        "Elegí un medio de pago válido.",
        "Choose a valid payment method.",
      ),
    );
  }

  if (!settings.transferEnabled) {
    throw new PaymentMethodError(
      message(
        locale,
        "La transferencia no está habilitada.",
        "Bank transfer is not enabled.",
      ),
    );
  }

  if (!isBankTransferAvailable(settings)) {
    throw new PaymentMethodError(
      message(
        locale,
        "La transferencia todavía no está configurada.",
        "Bank transfer is not configured yet.",
      ),
    );
  }

  return BANK_TRANSFER;
}
