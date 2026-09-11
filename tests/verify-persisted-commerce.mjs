import assert from "node:assert/strict";
import { mapCart } from "../src/lib/commerce/providers/payload-ecommerce/mappers.ts";
import { validateCheckoutCart } from "../src/lib/checkout/validate-cart.ts";
import { cartToPreferenceItems } from "../src/lib/checkout/providers/mercado-pago/map-cart.ts";

let input = "";
for await (const chunk of process.stdin) input += chunk;
const { accepted, changed, confirmed, discontinued, variantID } =
  JSON.parse(input);
process.env.PAYLOAD_ECOMMERCE_URL = "http://localhost:4000";
process.env.PAYLOAD_ECOMMERCE_CURRENCY = "ARS";
process.env.PAYLOAD_ECOMMERCE_AMOUNT_IS_CENTS = "true";

for (const locale of ["es", "en"]) {
  const original = mapCart(accepted[locale]);
  validateCheckoutCart(original, locale);
  const originalPayment = cartToPreferenceItems(original)[0];
  assert.equal(originalPayment.id, `variant:${variantID}`);
  assert.equal(originalPayment.currency_id, "ARS");
  assert.equal(originalPayment.unit_price, 5000.5);
  assert.equal(originalPayment.quantity, 2);
  assert.ok(
    original.lines[0].merchandise.selectedOptions.some(
      (option) => option.value === "100 g",
    ),
  );
  const stale = mapCart(changed[locale]);
  assert.equal(stale.lines[0].issue, "priceChanged");
  assert.throws(() => validateCheckoutCart(stale, locale), { status: 409 });
  const current = mapCart(confirmed[locale]);
  validateCheckoutCart(current, locale);
  const payment = cartToPreferenceItems(current)[0];
  assert.equal(payment.id, originalPayment.id);
  assert.equal(payment.currency_id, "ARS");
  assert.equal(payment.unit_price, 6000.5);
  assert.equal(payment.quantity, 1);
  const unavailable = mapCart(discontinued[locale]);
  assert.equal(unavailable.lines.length, 1);
  assert.equal(unavailable.lines[0].issue, "unavailable");
  assert.equal(
    unavailable.lines[0].merchandise.id,
    original.lines[0].merchandise.id,
  );
  assert.throws(() => validateCheckoutCart(unavailable, locale), {
    status: 409,
  });
}
console.log(
  "PASS: datos persistidos → contrato storefront → validación checkout → importes e identidad ARS en ES/EN",
);
