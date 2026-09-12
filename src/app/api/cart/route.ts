import { NextResponse } from "next/server";
import { commerce } from "@/lib/commerce";
import type {
  Cart,
  CartLineInput,
  CartLineUpdateInput,
} from "@/types/commerce";
import { CommerceError } from "@/types/commerce";
import type { FulfillmentMode } from "@/lib/commerce/local-purchase";

export const dynamic = "force-dynamic";

function emptyCart(): Cart {
  return {
    id: "",
    checkoutUrl: "",
    fulfillmentMode: null,
    totalQuantity: 0,
    note: null,
    cost: {
      subtotalAmount: { amount: "0.00", currencyCode: "ARS" },
      totalAmount: { amount: "0.00", currencyCode: "ARS" },
      totalTaxAmount: null,
    },
    lines: [],
  };
}

function errorResponse(error: unknown, fallback = "Cart request failed.") {
  if (error instanceof CommerceError) {
    return NextResponse.json(
      {
        error: error.message,
        provider: error.provider,
        details: error.errors ?? null,
      },
      { status: error.status && error.status >= 400 ? error.status : 502 },
    );
  }

  return NextResponse.json(
    {
      error: error instanceof Error ? error.message : fallback,
    },
    { status: 500 },
  );
}

/** GET /api/cart?cartId=&locale= */
export async function GET(request: Request) {
  try {
    if (!commerce.isConfigured()) {
      return NextResponse.json({ cart: emptyCart(), configured: false });
    }

    const { searchParams } = new URL(request.url);
    const cartId = searchParams.get("cartId")?.trim();
    const locale = searchParams.get("locale")?.trim() || undefined;

    if (!cartId) {
      return NextResponse.json({ cart: emptyCart(), configured: true });
    }

    const cart = await commerce.getCart(cartId, { locale });
    return NextResponse.json({
      cart: cart ?? emptyCart(),
      configured: true,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

type CartBody =
  | { action: "confirmPrices"; cartId: string; locale?: string }
  | {
      action: "create";
      lines?: CartLineInput[];
      note?: string;
      locale?: string;
      fulfillmentMode?: FulfillmentMode | null;
    }
  | {
      action: "add";
      cartId?: string;
      lines: CartLineInput[];
      locale?: string;
    }
  | {
      action: "setFulfillmentMode";
      cartId: string;
      fulfillmentMode: FulfillmentMode;
      locale?: string;
    }
  | {
      action: "update";
      cartId: string;
      lines: CartLineUpdateInput[];
      locale?: string;
    }
  | {
      action: "remove";
      cartId: string;
      lineIds: string[];
      locale?: string;
    };

/** POST /api/cart — create / add / update / remove */
export async function POST(request: Request) {
  try {
    if (!commerce.isConfigured()) {
      return NextResponse.json(
        {
          error:
            "Commerce provider is not configured. Set Shopify or Payload env vars.",
          configured: false,
          cart: emptyCart(),
        },
        { status: 503 },
      );
    }

    const body = (await request.json()) as CartBody;
    const locale = body.locale?.trim() || undefined;
    const cartParams = { locale };

    switch (body.action) {
      case "confirmPrices": {
        if (typeof body.cartId !== "string" || !body.cartId.trim())
          return NextResponse.json(
            { error: "cartId is required." },
            { status: 400 },
          );
        const cart = await commerce.updateCartLines(body.cartId, [], {
          ...cartParams,
          acceptPriceChanges: true,
        });
        return NextResponse.json({ cart, configured: true });
      }
      case "create": {
        const cart = await commerce.createCart({
          lines: body.lines,
          note: body.note,
          fulfillmentMode: body.fulfillmentMode,
          locale,
        });
        return NextResponse.json({ cart, configured: true });
      }

      case "add": {
        if (!body.lines?.length) {
          return NextResponse.json(
            { error: "lines are required for add." },
            { status: 400 },
          );
        }

        const cartId = body.cartId?.trim();
        if (!cartId) {
          const created = await commerce.createCart({
            lines: body.lines,
            locale,
          });
          return NextResponse.json({ cart: created, configured: true });
        }

        // A persisted browser reference can outlive its guest cart. Confirm
        // absence before replacing it; never retry arbitrary mutation errors.
        const existing = await commerce.getCart(cartId, cartParams);
        if (!existing) {
          const created = await commerce.createCart({
            lines: body.lines,
            locale,
          });
          return NextResponse.json({ cart: created, configured: true });
        }

        // Do not replace a saved cart when merchandise validation or transport fails.
        const cart = await commerce.addCartLines(
          cartId,
          body.lines,
          cartParams,
        );
        return NextResponse.json({ cart, configured: true });
      }

      case "setFulfillmentMode": {
        if (!body.cartId?.trim()) {
          return NextResponse.json(
            { error: "cartId is required for fulfillment mode." },
            { status: 400 },
          );
        }
        const cart = await commerce.updateCartLines(body.cartId, [], {
          locale,
          fulfillmentMode: body.fulfillmentMode,
        });
        return NextResponse.json({ cart, configured: true });
      }

      case "update": {
        if (!body.cartId?.trim()) {
          return NextResponse.json(
            { error: "cartId is required for update." },
            { status: 400 },
          );
        }
        if (!body.lines?.length) {
          return NextResponse.json(
            { error: "lines are required for update." },
            { status: 400 },
          );
        }
        const cart = await commerce.updateCartLines(
          body.cartId,
          body.lines,
          cartParams,
        );
        return NextResponse.json({ cart, configured: true });
      }

      case "remove": {
        if (!body.cartId?.trim()) {
          return NextResponse.json(
            { error: "cartId is required for remove." },
            { status: 400 },
          );
        }
        if (!body.lineIds?.length) {
          return NextResponse.json(
            { error: "lineIds are required for remove." },
            { status: 400 },
          );
        }
        const cart = await commerce.removeCartLines(
          body.cartId,
          body.lineIds,
          cartParams,
        );
        return NextResponse.json({ cart, configured: true });
      }

      default:
        return NextResponse.json(
          { error: "Unknown cart action." },
          { status: 400 },
        );
    }
  } catch (error) {
    return errorResponse(error);
  }
}
