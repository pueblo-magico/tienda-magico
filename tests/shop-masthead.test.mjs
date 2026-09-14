import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("the shop masthead is full width with overlapping category cards", async () => {
  const [source, categories] = await Promise.all([
    readFile("src/features/shop/ShopPage.tsx", "utf8"),
    readFile("apps/cms/src/collections/Categories.ts", "utf8"),
  ]);

  assert.match(categories, /name: 'slogan'[\s\S]+localized: true/);
  assert.match(
    source,
    /const heroImage = catalog\.selectedCollection\?\.image/,
  );
  assert.match(source, /\.slice\(0, 5\)/);
  assert.match(source, /className="relative h-72 w-full overflow-hidden"/);
  assert.match(source, /className="relative z-10 -mt-10"/);
  assert.doesNotMatch(source, /<Eyebrow>\{labels\.subcategories\}<\/Eyebrow>/);
  assert.match(source, /aria-current="page"/);
  assert.match(source, /className="text-muted absolute top-6/);
  assert.match(source, /catalog\.selectedCollection\?\.slogan/);
  assert.match(
    source,
    /<Eyebrow className="flex items-center gap-2">[\s\S]+<CategoryIcon[\s\S]+className="size-3"/,
  );
  assert.match(source, /className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"/);
});
