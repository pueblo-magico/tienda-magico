# PMG-360 manual verification

Status: partial implementation; ecommerce order and local-sale creation are ready for manual acceptance.

## Scope of this guide

This guide verifies fulfillment-mode selection and persistence, idempotent
ecommerce order creation, and the linked local-sale record. It does not certify
authoritative payment reconciliation, duplicate callbacks, or inventory effects.
Those remain pending within PMG-360 and its boundary with Task 07.

## Preparation

1. Use a disposable PostgreSQL database, never production.
2. Apply migrations through `20260912_122450_task_06_1_order_local_sale`.
3. Configure the storefront with Payload as its commerce provider and a test API
   key authorized to create and read orders.
4. Configure Mercado Pago using test credentials only.
5. Create one simple product and one published variant. Both must have a SKU,
   ARS price, stock, and localized EN/ES content.
6. Record the commit, product and variant IDs, and SKUs. Never include API keys,
   cookies, tokens, or real personal data in the evidence.

Repeat the UI flows in EN and ES at 1440 px and 390 px. Test Tab, Shift+Tab,
Space, and Enter on the fulfillment options.

## Main cases

| Case                      | Steps                                                                                        | Expected result                                                                                                                                                               |
| ------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Required fulfillment mode | Add a product and try to continue without choosing a fulfillment mode.                       | The action remains disabled or checkout returns 400 with a localized message. No order is created.                                                                            |
| Local collection          | Choose local collection, reload, change locale, and continue to checkout.                    | The choice persists. Exactly one ecommerce order and one linked local-sale record are created. The payment external reference is the order ID.                                |
| Delivery                  | Choose delivery, reload, and continue to checkout.                                           | The choice persists and an ecommerce order is created. No local-sale record is created. Address requirements must be verified when the complete delivery flow is implemented. |
| Change fulfillment mode   | Choose collection, switch to delivery, then return to collection before payment.             | The cart retains only the last choice. The order and local sale record local collection.                                                                                      |
| Checkout retry            | Start checkout twice from the same cart, including a retry after a payment-provider failure. | Both requests reuse the same order through `checkoutKey`. Only one local-sale record exists for the order.                                                                    |
| Simple product            | Purchase the simple product for local collection.                                            | The snapshot contains product ID, SKU, localized title, quantity, unit price, currency, and total without inventing a variant.                                                |
| Variant                   | Purchase the variant for local collection.                                                   | The order references the exact product and variant. The snapshot preserves the SKU, localized title, and every selected option.                                               |
| Multiple lines            | Add a simple product and a variant with different quantities.                                | The order contains both lines and the snapshot preserves each identity, quantity, and amount. The total matches the confirmed cart.                                           |
| Shopify delivery          | Configure Shopify, choose delivery, and start checkout.                                      | Checkout continues through Shopify's native checkout without creating a Payload order.                                                                                        |
| Shopify collection        | Configure Shopify, choose local collection, and start checkout.                              | The request fails closed with an explicit message and does not simulate a local sale without a Payload order.                                                                 |

## CMS verification

After each successful Payload case:

- [ ] The order contains `checkoutKey`, `cartReference`, `fulfillmentMode`, and
      `commercialSnapshot`.
- [ ] The order amount is stored in cents, while the snapshot retains decimal
      amounts and currency codes.
- [ ] Local collection creates exactly one Local Sales entry linked to the order.
- [ ] Delivery does not create a Local Sales entry.
- [ ] The local-sale key is `local-sale:<order-id>` and remains unique.
- [ ] The order and local sale preserve the same commercial snapshot.
- [ ] Identity, fulfillment, buyer, snapshot, and payment fields on the local
      sale cannot be edited, including by administrators.
- [ ] Public responses expose no exact stock, reservations, purchase costs,
      provider details, or operational notes.

## Failure and recovery

- [ ] Temporarily remove the Mercado Pago credentials after creating the cart.
      Checkout fails, and retrying does not create duplicate orders.
- [ ] Remove the CMS API key. Order creation fails closed and no payment
      preference starts without an order.
- [ ] Change the price or discontinue the variant before continuing. The flow
      keeps the lines actionable and does not create an order from stale data.
- [ ] Send two simultaneous requests for the same cart. The unique index must
      prevent duplicate orders; only one local link may remain afterward.
- [ ] Attempt to create an order without `checkoutKey`, `cartReference`,
      `fulfillmentMode`, or `commercialSnapshot`. The CMS must reject it.

Do not mark duplicate callbacks, late payments, reconciliation, or inventory
mutations as accepted through this guide. They still require the authoritative
payment and inventory implementation.

## Automated evidence

Run from the repository root:

```powershell
node --import ./tests/register.mjs --test tests/local-purchase.test.mjs
npm run lint
npm run lint:cms
npm run build
npm run build:cms
```

For every case, record the date, commit, provider, locale, viewport, disposable
IDs, observed result, pass/fail/blocked status, and evidence without secrets.
Automated tests do not replace inspecting the persisted records.
