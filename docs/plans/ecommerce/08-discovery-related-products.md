# 08 — Search, filters, and product recommendations

Status: planned. Depends on: 02, 03, 04.

## Codex implementation prompt

Connect the designed search/filter and related-product experiences to real CMS data. Follow `docs/plans/ecommerce/README.md`; reuse existing shop controls and shared primitives rather than rebuilding them.

### Feature request

Support search of localized public names/descriptions, category filtering, ARS price bounds, public tag filtering, sorting, active removable filter chips, clear-all, and pagination. Keep query state shareable in URLs and stable across EN/ES navigation. Validate all query inputs.

Define filter semantics: OR within selected categories, OR within selected tags initially, AND between different filter groups and search. Price eligibility must match at least one purchasable variant in the requested range. Filter/sort the complete eligible catalog before pagination, not only the loaded page. Any limitation of an existing provider must be explicit, not silently simulated by partial client filtering.

Provide CMS relationships for similar products and complementary products, with editorial ordering and automatic fallback by category/tags. Similar products are alternatives; complementary products complete a ritual. Exclude self, duplicates, drafts, and nonpurchasable items from purchase recommendations. Preserve allowed discontinued product pages while suggesting purchasable alternatives.

Mobile filters support an accessible draft selection/apply workflow, cancel/reopen behavior, visible active count, and empty-result recovery. Product links navigate to the selected item, not a placeholder product.

### Definition of done

- [ ] Category, price, tags, search, and sort compose correctly over the full result set with accurate counts/pagination.
- [ ] EN/ES switching retains stable filter IDs and the equivalent route/query.
- [ ] Variant price-range edge cases, malformed bounds, empty results, and hidden tags are tested.
- [ ] Related links open correct localized product pages and respect editorial ordering/fallback exclusions.
- [ ] Loading/error/empty states, keyboard operation, mobile filter apply/cancel, and focus return are verified.
- [ ] Public search results cannot expose supplier, cost, or internal notes.
- [ ] Provider adapters, docs, and shared checks are complete.

### Out of scope

Personalized recommendation engines, external search services, and campaign-specific discount pricing (integrated by task 09).
