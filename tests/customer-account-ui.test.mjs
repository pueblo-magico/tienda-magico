import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime.js";
import { AccountProvider } from "../src/lib/account/client.tsx";
import { AccountPage } from "../src/features/account/AccountPage.tsx";
import { CheckoutAccount } from "../src/features/cart/components/CheckoutAccount.tsx";
import { OrderList } from "../src/features/orders/OrderList.tsx";

for (const locale of ["es", "en"]) {
  test(`cuentas ${locale}: formulario opcional y ficha privada sin contraseña`, async () => {
    const messages = JSON.parse(
      await readFile(new URL(`../messages/${locale}.json`, import.meta.url)),
    );
    const render = (component, customer = null) =>
      renderToStaticMarkup(
        createElement(
          NextIntlClientProvider,
          { locale, messages, timeZone: "UTC" },
          createElement(
            AppRouterContext.Provider,
            { value: { refresh() {} } },
            createElement(
              AccountProvider,
              { initialCustomer: customer },
              component,
            ),
          ),
        ),
      );
    const signup = render(createElement(AccountPage, { register: true }));
    assert.match(signup, /autoComplete="new-password"/);
    assert.match(signup, /minLength="12"/);
    assert.ok(signup.includes(messages.account.name));
    const customer = {
      id: 1,
      name: "Cliente de prueba",
      email: "test@example.test",
    };
    const profile = render(createElement(AccountPage), customer);
    assert.ok(profile.includes(customer.name));
    assert.ok(profile.includes(customer.email));
    assert.doesNotMatch(profile, /type="password"/);
    const guestCheckout = render(
      createElement(CheckoutAccount, { name: "", email: "", onUseData() {} }),
    );
    assert.ok(
      guestCheckout.includes(
        messages.account.optional.replaceAll("'", "&#x27;"),
      ),
    );
    assert.doesNotMatch(guestCheckout, /type="password"/);
    assert.ok(guestCheckout.includes(messages.account.login));
    const saved = render(
      createElement(CheckoutAccount, { name: "", email: "", onUseData() {} }),
      customer,
    );
    assert.ok(saved.includes(messages.account.useData));
    assert.ok(saved.includes(messages.account.logout));
    const emptyHistory = render(
      createElement(OrderList, {
        orders: [],
        serverTime: 0,
        historyScope: "account",
      }),
      customer,
    );
    assert.ok(!emptyHistory.includes(messages.orders.empty));
    assert.ok(emptyHistory.includes(messages.orders.emptyAccount));
  });
}
