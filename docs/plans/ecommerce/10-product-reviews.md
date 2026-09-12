# 10 — Moderated product reviews and verified guest purchases

Status: planned. Depends on: 03, 07.

## Codex implementation prompt

Implement genuine product reviews with moderation and privacy. Follow `docs/plans/ecommerce/README.md`.

### Feature request

Add Reviews with product, optional variant, integer rating 1–5, optional title, body, original language, public display name, anonymous-display preference, optional private customer relationship, private qualifying order-line reference, moderation state, timestamps, and optional localized merchant response.

Keep customer-authored text in its original language. Do not require two translations or overwrite originals; defer automatic translation. Public anonymous display does not imply unverified anonymous submission. Initial submission eligibility is a verified qualifying purchase, including guest purchasers through an expiring single-use invitation. Determine available invitation delivery infrastructure before adding dependencies; do not introduce a new email provider without approval.

Verify invitations/order ownership server-side, store token hashes, exclude sensitive references from public responses, rate-limit submissions, and reject duplicate reviews per agreed purchase/product policy. Reviews start pending. Moderators approve/reject content; approval cannot fabricate a verified-purchase badge. Average rating and count derive only from approved reviews and invalidate on moderation changes.

### Definition of done

- [ ] Verified account and guest buyers can submit a review using authorized flows.
- [ ] Anonymous display hides identity but does not bypass purchase verification.
- [ ] Unapproved content and customer/order/invitation identifiers never appear in public reads.
- [ ] Invalid ratings, expired/reused invitations, wrong ownership, duplicates, spam attempts, and unsafe text are tested.
- [ ] Product ratings/counts match approved records after approval, rejection, and removal.
- [ ] Review UI shows original language, empty/loading/error states, and accessible EN/ES interface labels.
- [ ] Delivery dependency is implemented and verified or explicitly reported as blocked; no fake email-success claims.
- [ ] Migration, moderation guide, privacy tests, and shared verification are complete.

### Out of scope

Public unverified review submissions, image/video reviews, automated translation, and recommendation scoring.
