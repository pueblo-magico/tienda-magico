import { CheckoutConfigError } from "@/types/checkout";

export type MercadoPagoConfig = {
  accessToken: string;
  apiBaseUrl: string;
  sandbox: boolean;
  statementDescriptor?: string;
  binaryMode: boolean;
};

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function readBool(name: string, fallback: boolean): boolean {
  const value = readEnv(name);
  if (value == null) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export function getMercadoPagoConfig(): MercadoPagoConfig {
  const accessToken =
    readEnv("MERCADOPAGO_ACCESS_TOKEN") ?? readEnv("MP_ACCESS_TOKEN");

  if (!accessToken) {
    throw new CheckoutConfigError(
      "Missing MERCADOPAGO_ACCESS_TOKEN for Mercado Pago Checkout.",
      "mercado-pago",
    );
  }

  const sandboxExplicit = readEnv("MERCADOPAGO_SANDBOX") ?? readEnv("MP_SANDBOX");
  const sandbox =
    sandboxExplicit != null
      ? ["1", "true", "yes", "on"].includes(sandboxExplicit.toLowerCase())
      : accessToken.startsWith("TEST-");

  return {
    accessToken,
    apiBaseUrl: (
      readEnv("MERCADOPAGO_API_BASE_URL") ?? "https://api.mercadopago.com"
    ).replace(/\/$/, ""),
    sandbox,
    statementDescriptor: readEnv("MERCADOPAGO_STATEMENT_DESCRIPTOR"),
    binaryMode: readBool("MERCADOPAGO_BINARY_MODE", false),
  };
}

export function isMercadoPagoConfigured(): boolean {
  try {
    getMercadoPagoConfig();
    return true;
  } catch {
    return false;
  }
}
