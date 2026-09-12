import {
  CommerceConfigError,
  type Cart,
  type CheckoutOrder,
} from "@/types/commerce";
import type { CheckoutCustomer } from "@/types/checkout";
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
  commercialSnapshot: {
    cartId: string;
    currency: string;
    total: Cart["cost"]["totalAmount"];
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
): CheckoutOrderInput {
  if (!cart.fulfillmentMode) {
    throw new Error("A fulfillment mode is required to create an order.");
  }

  const currency = cart.cost.totalAmount.currencyCode;
  return {
    checkoutKey: `checkout:${cart.id.trim()}`,
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
    commercialSnapshot: {
      cartId: cart.id,
      currency,
      total: cart.cost.totalAmount,
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

type PayloadOrderResponse = { id: string | number };
type PayloadOrderList = { docs?: PayloadOrderResponse[] };

export async function createCheckoutOrder(
  cart: Cart,
  customer?: CheckoutCustomer,
): Promise<CheckoutOrder> {
  if (!getPayloadEcommerceConfig().apiKey) {
    throw new CommerceConfigError(
      "Configurá PAYLOAD_ECOMMERCE_API_KEY para crear pedidos desde el checkout.",
      "payload",
    );
  }

  const input = buildCheckoutOrderInput(cart, customer);
  const findExistingOrder = async () =>
    payloadFetch<PayloadOrderList>({
      path: collectionPath("orders"),
      query: {
        "where[checkoutKey][equals]": input.checkoutKey,
        limit: 1,
      },
    });
  const existingOrder = (await findExistingOrder()).docs?.[0];
  if (existingOrder) return { id: String(existingOrder.id) };

  let order: PayloadOrderResponse;
  try {
    order = await payloadFetch<PayloadOrderResponse>({
      method: "POST",
      path: collectionPath("orders"),
      body: input,
    });
  } catch (error) {
    const concurrentOrder = (await findExistingOrder()).docs?.[0];
    if (concurrentOrder) return { id: String(concurrentOrder.id) };
    throw error;
  }

  return { id: String(order.id) };
}
