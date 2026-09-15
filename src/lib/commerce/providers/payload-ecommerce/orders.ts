import {
  CommerceConfigError,
  type Cart,
  type CheckoutOrder,
  type CheckoutOrderOptions,
} from "@/types/commerce";
import {
  BANK_TRANSFER,
  MERCADO_PAGO,
  type CheckoutCustomer,
  type PaymentMethod,
} from "@/types/checkout";
import { collectionPath, payloadFetch } from "./client";
import { getPayloadEcommerceConfig } from "./config";

type CheckoutOrderInput = {
  checkoutKey: string;
  cartReference: string;
  fulfillmentMode: NonNullable<Cart["fulfillmentMode"]>;
  customerEmail: string | null;
  buyerContact: { email: string | null; name: string | null };
  items: Array<{ product: number; variant?: number; quantity: number }>;
  amount: number;
  currency: string;
  status: "processing";
  paymentStatus: "pending";
  paymentMethod: PaymentMethod;
  paymentExpiresAt: string | null;
  commercialSnapshot: {
    cartId: string;
    currency: string;
    total: Cart["cost"]["totalAmount"];
    paymentMethod: PaymentMethod;
    paymentExpiresAt: string | null;
    items: Array<{
      productId: string;
      merchandiseId: string;
      sku: string | null;
      title: string;
      options: Cart["lines"][number]["merchandise"]["selectedOptions"];
      quantity: number;
      unitPrice: Cart["lines"][number]["cost"]["amountPerQuantity"];
      total: Cart["lines"][number]["cost"]["totalAmount"];
    }>;
  };
};

function numericId(value: string, label: string): number {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error(`Payload ${label} ID is invalid.`);
  }
  return id;
}

function orderItemRelations(
  productReference: string,
  merchandiseReference: string,
): { product: number; variant?: number } {
  const product = numericId(productReference, "product");
  const parts = merchandiseReference.trim().split(":");

  if (parts.length === 2 && parts[0] === "product") {
    const merchandiseProduct = numericId(parts[1], "product");
    if (merchandiseProduct !== product) {
      throw new Error(
        "Payload merchandise product does not match its cart line.",
      );
    }
    return { product };
  }

  if (parts.length === 2 && parts[0] === "variant") {
    return { product, variant: numericId(parts[1], "variant") };
  }

  if (parts.length === 2) {
    const merchandiseProduct = numericId(parts[0], "product");
    if (merchandiseProduct !== product) {
      throw new Error(
        "Payload merchandise product does not match its cart line.",
      );
    }
    return { product, variant: numericId(parts[1], "variant") };
  }

  const legacyId = numericId(merchandiseReference, "merchandise");
  return legacyId === product ? { product } : { product, variant: legacyId };
}

export function buildCheckoutOrderInput(
  cart: Cart,
  customer: CheckoutCustomer = {},
  options: CheckoutOrderOptions = {},
): CheckoutOrderInput {
  if (!cart.fulfillmentMode) {
    throw new Error("A fulfillment mode is required to create an order.");
  }

  const currency = cart.cost.totalAmount.currencyCode;
  const paymentMethod = options.paymentMethod ?? MERCADO_PAGO;
  return {
    checkoutKey: `checkout:${cart.id.trim()}${
      paymentMethod === BANK_TRANSFER ? `:${BANK_TRANSFER}` : ""
    }`,
    cartReference: cart.id,
    fulfillmentMode: cart.fulfillmentMode,
    customerEmail: customer.email?.trim() || null,
    buyerContact: {
      email: customer.email?.trim() || null,
      name: customer.name?.trim() || null,
    },
    items: cart.lines.map((line) => ({
      ...orderItemRelations(line.merchandise.product.id, line.merchandise.id),
      quantity: line.quantity,
    })),
    amount: Math.round(Number(cart.cost.totalAmount.amount) * 100),
    currency,
    status: "processing",
    paymentStatus: "pending",
    paymentMethod,
    paymentExpiresAt: options.paymentExpiresAt ?? null,
    commercialSnapshot: {
      cartId: cart.id,
      currency,
      total: cart.cost.totalAmount,
      paymentMethod,
      paymentExpiresAt: options.paymentExpiresAt ?? null,
      items: cart.lines.map((line) => ({
        productId: line.merchandise.product.id,
        merchandiseId: line.merchandise.id,
        sku: line.merchandise.sku ?? null,
        title: `${line.merchandise.product.title} — ${line.merchandise.title}`,
        options: line.merchandise.selectedOptions,
        quantity: line.quantity,
        unitPrice: line.cost.amountPerQuantity,
        total: line.cost.totalAmount,
      })),
    },
  };
}

type PayloadOrderResponse = {
  id: string | number;
  publicReference?: string | null;
  paymentExpiresAt?: string | null;
  paymentMethod?: PaymentMethod | null;
  paymentStatus?: CheckoutOrder["paymentStatus"] | null;
  amount?: number | null;
  currency?: string | null;
};
type PayloadOrderCreateResponse =
  PayloadOrderResponse | { doc: PayloadOrderResponse };
type PayloadOrderList = { docs?: PayloadOrderResponse[] };

export function normalizePayloadOrderResponse(
  response: PayloadOrderCreateResponse,
): CheckoutOrder {
  const order = "doc" in response ? response.doc : response;
  if (order.id == null || !order.publicReference?.trim()) {
    throw new Error("Payload order response is missing its public reference.");
  }
  return {
    id: String(order.id),
    publicReference: order.publicReference,
    paymentExpiresAt: order.paymentExpiresAt ?? null,
    paymentMethod: order.paymentMethod ?? MERCADO_PAGO,
    paymentStatus: order.paymentStatus ?? "unverified",
    total: {
      amount: String((order.amount ?? 0) / 100),
      currencyCode: order.currency ?? "ARS",
    },
  };
}

export async function getCheckoutOrderByPublicReference(
  reference: string,
): Promise<CheckoutOrder | null> {
  const normalizedReference = reference.trim();
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      normalizedReference,
    )
  ) {
    return null;
  }
  const response = await payloadFetch<PayloadOrderList>({
    path: collectionPath("orders"),
    query: {
      "where[publicReference][equals]": normalizedReference,
      limit: 1,
      depth: 0,
    },
  });
  const order = response.docs?.[0];
  return order ? normalizePayloadOrderResponse(order) : null;
}

export async function createCheckoutOrder(
  cart: Cart,
  customer?: CheckoutCustomer,
  options?: CheckoutOrderOptions,
): Promise<CheckoutOrder> {
  if (!getPayloadEcommerceConfig().apiKey) {
    throw new CommerceConfigError(
      "Configurá PAYLOAD_ECOMMERCE_API_KEY para crear pedidos desde el checkout.",
      "payload",
    );
  }

  const input = buildCheckoutOrderInput(cart, customer, options);
  const findExistingOrder = async () =>
    payloadFetch<PayloadOrderList>({
      path: collectionPath("orders"),
      query: {
        "where[checkoutKey][equals]": input.checkoutKey,
        limit: 1,
      },
    });
  const existingOrder = (await findExistingOrder()).docs?.[0];
  if (existingOrder) return normalizePayloadOrderResponse(existingOrder);

  let orderResponse: PayloadOrderCreateResponse;
  try {
    orderResponse = await payloadFetch<PayloadOrderCreateResponse>({
      method: "POST",
      path: collectionPath("orders"),
      body: input,
    });
  } catch (error) {
    const concurrentOrder = (await findExistingOrder()).docs?.[0];
    if (concurrentOrder) return normalizePayloadOrderResponse(concurrentOrder);
    throw error;
  }

  const order = "doc" in orderResponse ? orderResponse.doc : orderResponse;
  return normalizePayloadOrderResponse(order);
}
