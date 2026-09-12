# Task 06.2: camera-assisted product discovery

> JIRA: PMG-361

## Scope

Add an opt-in camera experience to the webshop after the local-purchase flow is
stable. Visual recognition helps the visitor find a product; it does not decide
the product, variant, price, fulfillment mode, or purchase.

## Functional requirements

- Request camera permission only after the visitor chooses the scan action.
- Capture locally where possible and explain when an upload is required.
- Send recognition requests through a server-side boundary or approved provider.
- Never expose provider credentials in browser code.
- Return ranked candidate products with confidence and visible labels.
- Require explicit candidate confirmation before opening a product page.
- Preserve normal webshop navigation after confirmation.
- Require the buyer to choose local collection or delivery separately.
- Offer text search and staff assistance when recognition is unavailable or uncertain.
- Support denied permission, unavailable camera, offline, timeout, upload failure,
  and low-confidence states.
- Do not use face recognition or infer customer identity.
- Do not retain images or recognition results without an approved retention policy.

## Boundary requirements

Recognition output is untrusted discovery input. It must be resolved against
the authoritative catalog before navigation and must never bypass product,
variant, price, availability, checkout, or inventory validation. It must not
expose Task 05 purchasing data or private inventory details.

## Definition of Done

- [ ] Supported mobile browsers have accessible permission and camera failure states.
- [ ] Candidates show confidence and require explicit user confirmation.
- [ ] No uncertain result automatically adds an item to the cart.
- [ ] Confirmed results open the canonical localized product page.
- [ ] Local collection versus delivery remains an explicit buyer choice.
- [ ] Text-search and staff fallbacks work when recognition fails.
- [ ] Provider credentials, private data, and unnecessary images are not leaked or retained.
- [ ] EN/ES desktop/mobile, keyboard, privacy, timeout, offline, and low-confidence checks are recorded.
