import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("the shop masthead is full width with overlapping category cards", async () => {
  const [source, loader, categories, siteSettings] = await Promise.all([
    readFile("src/features/shop/ShopPage.tsx", "utf8"),
    readFile("src/features/shop/load-shop-catalog.ts", "utf8"),
    readFile("apps/cms/src/collections/Categories.ts", "utf8"),
    readFile("apps/cms/src/globals/SiteSettings.ts", "utf8"),
  ]);

  assert.match(categories, /name: 'slogan'[\s\S]+localized: true/);
  assert.match(
    siteSettings,
    /name: 'shopHeroImage'[\s\S]+relationTo: 'media'[\s\S]+localized: true/,
  );
  assert.match(loader, /siteSettings: SiteSettings/);
  assert.match(loader, /getSiteSettings\(locale\)/);
  assert.match(
    source,
    /catalog\.selectedCollection[\s\S]+catalog\.siteSettings\.shopHeroImage/,
  );
  assert.match(source, /\.slice\(0, 5\)/);
  assert.match(source, /className="relative h-72 w-full overflow-hidden"/);
  assert.match(
    source,
    /from-warm via-warm\/95[^"]+w-full bg-gradient-to-r to-transparent sm:w-4\/5 lg:w-3\/5/,
  );
  assert.match(source, /className="relative z-10 -mt-10"/);
  assert.doesNotMatch(source, /<Eyebrow>\{labels\.subcategories\}<\/Eyebrow>/);
  assert.match(source, /aria-current="page"/);
  assert.match(source, /className="text-muted absolute top-6/);
  assert.match(source, /catalog\.selectedCollection\?\.slogan/);
  assert.doesNotMatch(source, /!text-text-black/);
  assert.match(
    source,
    /<Body size="lg" className="text-text-black max-w-2xl">/,
  );
  assert.match(
    source,
    /catalog\.selectedCollection[\s\S]+\? catalog\.selectedCollection\.description[\s\S]+: labels\.subtitle/,
  );
  assert.match(
    source,
    /<Eyebrow className="flex items-center gap-2">[\s\S]+<CategoryIcon[\s\S]+className="size-3"/,
  );
  assert.match(source, /className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"/);
  assert.match(
    source,
    /const isRootCategoryCard = !catalog\.selectedCollection/,
  );
  assert.match(source, /isRootCategoryCard \? "h-44" : "min-h-20"/);
  assert.match(
    source,
    /isRootCategoryCard[\s\S]+\? "flex-col items-start justify-end gap-2"[\s\S]+: "items-center gap-4"/,
  );
  assert.match(
    source,
    /isRootCategoryCard[\s\S]+\? "absolute right-4 bottom-4"[\s\S]+: "relative ml-auto"/,
  );
  assert.match(
    source,
    /isRootCategoryCard[\s\S]+\? "absolute top-4 left-4"[\s\S]+: "relative"/,
  );
  assert.match(source, /isRootCategoryCard && collection\.image\?\.url/);
  assert.match(source, /isRootCategoryCard \? collection\.icon/);
});

test("the product grid uses the compact desktop density", async () => {
  const [source, quickAdd, messagesEn, messagesEs] = await Promise.all([
    readFile("src/features/shop/ProductGrid.tsx", "utf8"),
    readFile("src/features/cart/components/AddToCartButton.tsx", "utf8"),
    readFile("messages/en.json", "utf8"),
    readFile("messages/es.json", "utf8"),
  ]);

  assert.match(source, /lg:grid-cols-4 xl:grid-cols-5/);
  assert.match(source, /<li key=\{product\.id\} className="h-full">/);
  assert.match(source, /product\.quickAddMerchandiseId/);
  assert.match(source, /<AddToCartButton/);
  assert.match(quickAdd, /ShoppingCart/);
  assert.match(quickAdd, /addItem\(\{ merchandiseId, quantity: 1 \}\)/);
  assert.match(quickAdd, /const \[isAdding, setIsAdding\] = useState\(false\)/);
  assert.doesNotMatch(quickAdd, /removeItem|hasItem|isMutating/);
  assert.match(messagesEn, /"adding": "Adding…"/);
  assert.match(messagesEs, /"adding": "Añadiendo…"/);
});
