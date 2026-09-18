import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  LOCAL_COLLECTION,
  DELIVERY,
  localSaleIdempotencyKey,
  parseFulfillmentMode,
} from "../src/lib/commerce/local-purchase.ts";
import { mapCart } from "../src/lib/commerce/providers/payload-ecommerce/mappers.ts";
import { mapCart as mapShopifyCart } from "../src/lib/commerce/providers/shopify/mappers.ts";
import { cartsCollectionOverride } from "../apps/cms/src/collections/cartCommercialValidation.ts";
import { LocalSales } from "../apps/cms/src/collections/LocalSales.ts";
import { ordersCollectionOverride } from "../apps/cms/src/collections/orderCommercialSnapshot.ts";
import {
  buildCheckoutOrderInput,
  createCheckoutOrder,
} from "../src/lib/commerce/providers/payload-ecommerce/orders.ts";
import { ShopifyCommerceProvider } from "../src/lib/commerce/providers/shopify/provider.ts";
import { MercadoPagoCheckoutProvider } from "../src/lib/checkout/providers/mercado-pago/provider.ts";
import { CommerceSettings } from "../apps/cms/src/globals/CommerceSettings.ts";
import {
  DEFAULT_COMMERCE_SETTINGS,
  isFulfillmentModeEnabled,
  parseCommerceSettings,
} from "../src/lib/commerce/commerce-settings.ts";

process.env.PAYLOAD_ECOMMERCE_URL = "http://cms.test";
process.env.PAYLOAD_ECOMMERCE_CURRENCY = "ARS";
process.env.PAYLOAD_ECOMMERCE_AMOUNT_IS_CENTS = "true";

test("commerce settings default to local collection without delivery", () => {
  assert.deepEqual(DEFAULT_COMMERCE_SETTINGS, {
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
  });
  assert.deepEqual(parseCommerceSettings({}), DEFAULT_COMMERCE_SETTINGS);
  assert.equal(
    isFulfillmentModeEnabled(LOCAL_COLLECTION, DEFAULT_COMMERCE_SETTINGS),
    true,
  );
  assert.equal(
    isFulfillmentModeEnabled(DELIVERY, DEFAULT_COMMERCE_SETTINGS),
    false,
  );
});

test("the CMS exposes admin-managed storefront commerce settings", () => {
  assert.equal(CommerceSettings.slug, "commerce-settings");
  assert.equal(CommerceSettings.access?.read?.({ req: { user: null } }), true);
  assert.equal(
    CommerceSettings.access?.update?.({ req: { user: null } }),
    false,
  );

  const fields = CommerceSettings.fields.filter((field) => "name" in field);
  assert.deepEqual(
    fields.map((field) => ({
      name: field.name,
      label: field.label,
      defaultValue: field.defaultValue,
    })),
    [
      {
        name: "localCollectionEnabled",
        label: { es: "Habilitar retiro local", en: "Enable local collection" },
        defaultValue: true,
      },
      {
        name: "deliveryEnabled",
        label: { es: "Habilitar entrega", en: "Enable delivery" },
        defaultValue: false,
      },
      {
        name: "cashEnabled",
        label: { es: "Habilitar efectivo", en: "Enable cash" },
        defaultValue: false,
      },
      {
        name: "cashStaffEnabled",
        label: {
          es: "Habilitar caja en la tienda",
          en: "Enable storefront cash desk",
        },
        defaultValue: false,
      },
      {
        name: "cashStaffPassword",
        label: { es: "Nueva contraseña de caja", en: "New cash desk password" },
        defaultValue: undefined,
      },
      {
        name: "transferEnabled",
        label: {
          es: "Habilitar transferencia",
          en: "Enable bank transfer",
        },
        defaultValue: false,
      },
      {
        name: "transfer",
        label: {
          es: "Datos para transferencia",
          en: "Bank transfer details",
        },
        defaultValue: undefined,
      },
    ],
  );
});

test("the Payload editor supports Spanish and English interface languages", async () => {
  const config = await readFile(
    new URL("../apps/cms/src/payload.config.ts", import.meta.url),
    "utf8",
  );

  assert.match(
    config,
    /import \{ en \} from '@payloadcms\/translations\/languages\/en'/,
  );
  assert.match(
    config,
    /import \{ es \} from '@payloadcms\/translations\/languages\/es'/,
  );
  assert.match(config, /i18n:\s*\{[\s\S]*fallbackLanguage:\s*'es'/);
  assert.match(config, /supportedLanguages:\s*\{\s*es,\s*en\s*\}/);
});

test("disabled fulfillment modes are hidden and rejected by server routes", async () => {
  const [summary, cartRoute, checkoutRoute] = await Promise.all([
    readFile(
      new URL(
        "../src/features/cart/components/CartSummary.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(new URL("../src/app/api/cart/route.ts", import.meta.url), "utf8"),
    readFile(
      new URL("../src/app/api/checkout/route.ts", import.meta.url),
      "utf8",
    ),
  ]);

  assert.match(summary, /commerceSettings\.localCollectionEnabled/);
  assert.match(summary, /commerceSettings\.deliveryEnabled/);
  assert.match(cartRoute, /isFulfillmentModeEnabled/);
  assert.match(checkoutRoute, /isFulfillmentModeEnabled/);
});

test("accepts the two explicit fulfillment modes", () => {
  assert.equal(parseFulfillmentMode(LOCAL_COLLECTION), LOCAL_COLLECTION);
  assert.equal(parseFulfillmentMode(DELIVERY), DELIVERY);
});

test("rejects an omitted or unknown fulfillment mode", () => {
  for (const value of [undefined, null, "pickup", "local", ""]) {
    assert.throws(() => parseFulfillmentMode(value), /modalidad de entrega/i);
  }
});

test("returns a localized checkout validation message", () => {
  assert.throws(
    () => parseFulfillmentMode(null, "es"),
    /Elegí una modalidad de entrega válida antes de continuar con el pago\./,
  );
  assert.throws(
    () => parseFulfillmentMode(null, "en"),
    /Choose a valid fulfillment mode before checkout\./,
  );
});

test("derives one stable local-sale idempotency key from an order", () => {
  assert.equal(localSaleIdempotencyKey("order-123"), "local-sale:order-123");
  assert.equal(localSaleIdempotencyKey(" order-123 "), "local-sale:order-123");
  assert.throws(() => localSaleIdempotencyKey(""), /order/i);
});

test("maps the persisted fulfillment mode without inventing a default", () => {
  const cart = {
    id: 7,
    currency: "ARS",
    fulfillmentMode: LOCAL_COLLECTION,
    items: [],
  };

  assert.equal(mapCart(cart).fulfillmentMode, LOCAL_COLLECTION);
  assert.equal(
    mapCart({ ...cart, fulfillmentMode: null }).fulfillmentMode,
    null,
  );
  assert.throws(
    () => mapCart({ ...cart, fulfillmentMode: "pickup" }),
    /modalidad de entrega/i,
  );
});

test("Shopify maps its cart attribute to the same fulfillment contract", () => {
  const cart = mapShopifyCart({
    id: "gid://shopify/Cart/1",
    checkoutUrl: "https://shop.test/checkout",
    attributes: [{ key: "fulfillment_mode", value: DELIVERY }],
  });

  assert.equal(cart.fulfillmentMode, DELIVERY);
});

test("the CMS cart schema persists only the supported fulfillment modes", () => {
  const collection = cartsCollectionOverride({
    defaultCollection: { fields: [] },
  });
  const field = collection.fields.find(
    (candidate) => candidate.name === "fulfillmentMode",
  );

  assert.deepEqual(field?.options, [
    {
      label: { es: "Retiro local", en: "Local collection" },
      value: LOCAL_COLLECTION,
    },
    { label: { es: "Entrega", en: "Delivery" }, value: DELIVERY },
  ]);
  assert.equal(field?.required, false);
});

test("checkout cannot finalize a cart without an explicit fulfillment mode", async () => {
  const { validateFulfillmentModeForCheckout } =
    await import("../src/lib/commerce/local-purchase.ts");

  assert.equal(
    validateFulfillmentModeForCheckout(LOCAL_COLLECTION),
    LOCAL_COLLECTION,
  );
  assert.throws(
    () => validateFulfillmentModeForCheckout(null),
    /modalidad de entrega/i,
  );
});

test("the local-sale collection stores an order-linked operational snapshot privately", () => {
  const fields = LocalSales.fields.filter((field) => "name" in field);
  const names = new Set(fields.map((field) => field.name));

  for (const name of [
    "order",
    "idempotencyKey",
    "status",
    "fulfillmentMode",
    "paymentStatus",
    "snapshot",
  ]) {
    assert.ok(names.has(name), `missing local-sale field: ${name}`);
  }
  assert.equal(LocalSales.access?.read?.({ req: { user: null } }), false);

  for (const name of [
    "order",
    "idempotencyKey",
    "fulfillmentMode",
    "buyerContact",
    "snapshot",
    "paymentStatus",
    "paymentEvidence",
  ]) {
    const field = fields.find((candidate) => candidate.name === name);
    assert.equal(
      field?.access?.update?.({ req: { user: { roles: ["admin"] } } }),
      false,
      `${name} must not be editable after creation`,
    );
  }
});

test("builds an immutable ecommerce order snapshot from the priced cart", () => {
  const order = buildCheckoutOrderInput(
    {
      id: "cart-7",
      checkoutUrl: "https://shop.test/checkout",
      fulfillmentMode: LOCAL_COLLECTION,
      totalQuantity: 2,
      note: null,
      cost: {
        subtotalAmount: { amount: "20.00", currencyCode: "ARS" },
        totalAmount: { amount: "20.00", currencyCode: "ARS" },
        totalTaxAmount: null,
      },
      lines: [
        {
          id: "line-1",
          quantity: 2,
          cost: {
            amountPerQuantity: { amount: "10.00", currencyCode: "ARS" },
            totalAmount: { amount: "20.00", currencyCode: "ARS" },
          },
          merchandise: {
            id: "variant:4",
            title: "200 g",
            selectedOptions: [{ name: "Peso", value: "200 g" }],
            price: { amount: "10.00", currencyCode: "ARS" },
            product: {
              id: "8",
              handle: "cacao",
              title: "Cacao",
              featuredImage: null,
            },
          },
        },
      ],
    },
    { email: "buyer@example.com", name: "Ada" },
  );

  assert.equal(order.checkoutKey, "checkout:cart-7");
  assert.equal(order.amount, 2000);
  assert.deepEqual(order.items, [{ product: 8, variant: 4, quantity: 2 }]);
  assert.deepEqual(order.commercialSnapshot.items[0], {
    productId: "8",
    merchandiseId: "variant:4",
    sku: null,
    title: "Cacao — 200 g",
    options: [{ name: "Peso", value: "200 g" }],
    quantity: 2,
    unitPrice: { amount: "10.00", currencyCode: "ARS" },
    total: { amount: "20.00", currencyCode: "ARS" },
  });
});

test("maps a qualified simple-product reference without inventing a variant", () => {
  const order = buildCheckoutOrderInput(
    {
      id: "cart-8",
      checkoutUrl: "https://shop.test/checkout",
      fulfillmentMode: DELIVERY,
      totalQuantity: 1,
      note: null,
      cost: {
        subtotalAmount: { amount: "10.00", currencyCode: "ARS" },
        totalAmount: { amount: "10.00", currencyCode: "ARS" },
        totalTaxAmount: null,
      },
      lines: [
        {
          id: "line-1",
          quantity: 1,
          cost: {
            amountPerQuantity: { amount: "10.00", currencyCode: "ARS" },
            totalAmount: { amount: "10.00", currencyCode: "ARS" },
          },
          merchandise: {
            id: "product:8",
            title: "Cacao",
            selectedOptions: [],
            price: { amount: "10.00", currencyCode: "ARS" },
            product: {
              id: "8",
              handle: "cacao",
              title: "Cacao",
              featuredImage: null,
            },
          },
        },
      ],
    },
    {},
  );

  assert.deepEqual(order.items, [{ product: 8, quantity: 1 }]);
});

test("fails checkout order creation clearly when the Payload API key is missing", async () => {
  const previousApiKey = process.env.PAYLOAD_ECOMMERCE_API_KEY;
  delete process.env.PAYLOAD_ECOMMERCE_API_KEY;

  await assert.rejects(
    createCheckoutOrder({
      id: "1::secret",
      checkoutUrl: "https://shop.test/checkout",
      fulfillmentMode: LOCAL_COLLECTION,
      totalQuantity: 0,
      note: null,
      cost: {
        subtotalAmount: { amount: "0", currencyCode: "ARS" },
        totalAmount: { amount: "0", currencyCode: "ARS" },
        totalTaxAmount: null,
      },
      lines: [],
    }),
    /PAYLOAD_ECOMMERCE_API_KEY/,
  );

  if (previousApiKey) process.env.PAYLOAD_ECOMMERCE_API_KEY = previousApiKey;
});

test("the order schema creates one linked local-sale record after local checkout", () => {
  const collection = ordersCollectionOverride({
    defaultCollection: { fields: [], hooks: {} },
  });
  const names = new Set(
    collection.fields
      .filter((field) => "name" in field)
      .map((field) => field.name),
  );

  for (const name of [
    "checkoutKey",
    "cartReference",
    "fulfillmentMode",
    "commercialSnapshot",
  ]) {
    assert.ok(names.has(name), `missing order field: ${name}`);
  }
  assert.equal(collection.hooks?.afterChange?.length, 1);
});

test("Shopify keeps native delivery orders and rejects unsupported local pickup", async () => {
  const provider = new ShopifyCommerceProvider();
  const cart = {
    id: "gid://shopify/Cart/1",
    checkoutUrl: "https://shop.test/checkout",
    fulfillmentMode: DELIVERY,
    totalQuantity: 0,
    note: null,
    cost: {
      subtotalAmount: { amount: "0", currencyCode: "ARS" },
      totalAmount: { amount: "0", currencyCode: "ARS" },
      totalTaxAmount: null,
    },
    lines: [],
  };

  assert.equal(await provider.createCheckoutOrder(cart), null);
  await assert.rejects(
    provider.createCheckoutOrder({
      ...cart,
      fulfillmentMode: LOCAL_COLLECTION,
    }),
    /retiro local/i,
  );
});

test("fulfillment radios remain interactive while their serialized request is pending", async () => {
  const [summary, provider] = await Promise.all([
    readFile(
      new URL(
        "../src/features/cart/components/CartSummary.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL("../src/features/cart/CartProvider.tsx", import.meta.url),
      "utf8",
    ),
  ]);

  assert.match(summary, /disabled=\{fulfillmentDisabled\}/);
  assert.match(summary, /useId\(\)/);
  assert.match(summary, /name=\{fulfillmentGroupName\}/);
  assert.match(provider, /fulfillmentMutationQueue/);
  assert.match(provider, /setCart\(\(current\).*fulfillmentMode: mode/s);
});

test("Mercado Pago test credentials use the current Checkout Pro init point", async () => {
  const previousFetch = globalThis.fetch;
  const previousToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const previousSandbox = process.env.MERCADOPAGO_SANDBOX;
  process.env.MERCADOPAGO_ACCESS_TOKEN = "APP_USR-test-token";
  process.env.MERCADOPAGO_SANDBOX = "true";
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        id: "preference-1",
        init_point: "https://www.mercadopago.com.ar/checkout/start",
        sandbox_init_point: "https://sandbox.mercadopago.com.ar/checkout/pay",
      }),
      { status: 200 },
    );

  try {
    const session =
      await new MercadoPagoCheckoutProvider().createCheckoutSession({
        cart: {
          id: "cart-1",
          checkoutUrl: "https://shop.test/checkout",
          fulfillmentMode: LOCAL_COLLECTION,
          totalQuantity: 1,
          note: null,
          cost: {
            subtotalAmount: { amount: "10.00", currencyCode: "ARS" },
            totalAmount: { amount: "10.00", currencyCode: "ARS" },
            totalTaxAmount: null,
          },
          lines: [
            {
              id: "line-1",
              quantity: 1,
              cost: {
                amountPerQuantity: { amount: "10.00", currencyCode: "ARS" },
                totalAmount: { amount: "10.00", currencyCode: "ARS" },
              },
              merchandise: {
                id: "product:8",
                title: "Cacao",
                selectedOptions: [],
                price: { amount: "10.00", currencyCode: "ARS" },
                product: {
                  id: "8",
                  handle: "cacao",
                  title: "Cacao",
                  featuredImage: null,
                },
              },
            },
          ],
        },
        returnUrls: {
          success: "http://localhost:3000/es/checkout/success",
          failure: "http://localhost:3000/es/checkout/failure",
          pending: "http://localhost:3000/es/checkout/pending",
        },
      });

    assert.equal(
      session.redirectUrl,
      "https://www.mercadopago.com.ar/checkout/start",
    );
  } finally {
    globalThis.fetch = previousFetch;
    if (previousToken) process.env.MERCADOPAGO_ACCESS_TOKEN = previousToken;
    else delete process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (previousSandbox) process.env.MERCADOPAGO_SANDBOX = previousSandbox;
    else delete process.env.MERCADOPAGO_SANDBOX;
  }
});
