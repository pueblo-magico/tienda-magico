import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import {
  PathnameContext,
  SearchParamsContext,
} from "next/dist/shared/lib/hooks-client-context.shared-runtime.js";
import { LanguageSwitcher } from "../src/components/layout/LanguageSwitcher.tsx";

for (const [locale, pathname, query, expected] of [
  [
    "es",
    "/es/pago/pendiente",
    "payment_method=cash&order=order-demo&from=orders",
    "/en/checkout/pending?payment_method=cash&order=order-demo&from=orders",
  ],
  [
    "en",
    "/en/checkout/pending",
    "payment_method=bank-transfer&order=order-demo&from=cart",
    "/es/pago/pendiente?payment_method=bank-transfer&order=order-demo&from=cart",
  ],
  [
    "es",
    "/es/tienda",
    "q=t%C3%A9&category=a&category=b&sort=price",
    "/en/shop?q=t%C3%A9&category=a&category=b&sort=price",
  ],
  ["en", "/en/cart", "", "/es/carrito"],
]) {
  test(`el selector conserva parámetros y localiza ${pathname}: ${query}`, () => {
    const html = renderToStaticMarkup(
      createElement(
        NextIntlClientProvider,
        { locale, messages: {}, timeZone: "UTC" },
        createElement(
          PathnameContext.Provider,
          { value: pathname },
          createElement(
            SearchParamsContext.Provider,
            { value: new URLSearchParams(query) },
            createElement(LanguageSwitcher),
          ),
        ),
      ),
    );
    assert.ok(
      html.includes(`href="${expected.replaceAll("&", "&amp;")}"`),
      html,
    );
  });
}
