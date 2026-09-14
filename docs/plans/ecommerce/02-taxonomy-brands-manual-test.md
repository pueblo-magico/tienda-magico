# Task 02 manual test — taxonomy, brands, and storefront

## Setup

1. Back up local CMS data, start Postgres, and apply Payload migrations before starting the CMS.
2. Start CMS on port 4000 and storefront on port 3000 with the Payload commerce provider.
3. Use disposable test records; do not enter supplier, cost, or private operational data in public taxonomy fields.

## CMS fixtures

1. Create a visible parent category with different EN/ES titles, a shared slug, description, image, and lower display order.
2. Create a visible child category pointing to it. Confirm self-parenting and selecting a descendant as parent are rejected.
3. Create a second category, one hidden category, one active brand with logo and HTTPS website, one inactive brand, two visible localized tags, and one hidden tag.
4. Edit an existing product: set the child as primary, set the second and hidden categories as additional, assign the active brand and visible tags, and publish.
5. Confirm the CMS does not offer the primary category as an additional category. Leave any legacy free-text tags unchanged for migration review.

## Storefront — ES and EN

1. Open `/es/shop` and `/en/shop`. Confirm visible categories follow display order and their titles/descriptions change language while links keep the same category slug.
2. Open the child category. Confirm the product appears once. Open the second category and confirm the same product appears once there too. The hidden category must not be listed or publicly browsable.
3. Confirm child categories are indented below their parent in the filter. Select a parent and confirm up to five direct visible children appear as cards overlapping the category hero; hidden children and children beyond the fifth must not appear in this strip.
4. Configure localized category slogans and a horizontal header image. Open the category in EN and ES and confirm the breadcrumb appears first, followed by the localized category name, slogan, description, and selected category image.
5. Open the product. Confirm the breadcrumb is parent → primary child → product, all category links preserve locale, and language switching keeps the product/category slugs stable.
6. Confirm the active brand name/logo and visible localized tag labels render. Confirm hidden tags, inactive brands, and hidden category labels do not leak.
7. Remove the category image and one translation in CMS. Confirm the storefront shows a stable no-image layout and falls back to configured locale content without broken controls.
8. Hide the primary category and refresh after the documented cache window. Confirm the product still loads but the hidden category is omitted from its breadcrumb and category UI.

## Responsive and accessibility

1. At approximately 390 px and 1440 px widths, verify category navigation, filters, product grid, breadcrumb, brand, tags, and product purchase controls do not overlap or overflow.
2. Navigate category links, filters, product cards, gallery, variants, quantity, and add-to-cart using only the keyboard. Confirm visible focus and meaningful link/button names.
3. Verify no console error, broken image request, duplicated product, or empty taxonomy heading appears.

## Cache and rollback

1. Change a category title/order and a tag label. Verify categories update within 120 seconds and product detail within 60 seconds (or after a development-server restart).
2. Before testing rollback, back up the database. Roll back only in a disposable environment; new structured assignments are removed, while legacy free-text tags remain for recovery/manual reassignment.
