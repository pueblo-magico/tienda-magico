import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { FeedbackThanksModal } from "../src/features/orders/FeedbackThanksModal.tsx";

for (const locale of ["es", "en"]) {
  test(`agradecimiento ${locale}: muestra la puntuación enviada y permite cerrar`, async () => {
    const messages = JSON.parse(
      await readFile(`messages/${locale}.json`, "utf8"),
    );
    for (const rating of [0, 3, 5]) {
      const html = renderToStaticMarkup(
        createElement(
          NextIntlClientProvider,
          { locale, messages, timeZone: "UTC" },
          createElement(FeedbackThanksModal, {
            open: true,
            onClose() {},
            rating,
          }),
        ),
      );
      assert.ok(html.includes("<dialog"));
      assert.ok(html.includes(messages.orders.feedbackThanks.title));
      assert.ok(html.includes(messages.orders.feedbackThanks.close));
      assert.equal(
        html.includes(messages.orders.feedbackThanks.sent),
        rating > 0,
      );
      assert.equal(
        (html.match(/size-7 text-text-accent fill-current/g) ?? []).length,
        rating,
      );
    }
  });
}
