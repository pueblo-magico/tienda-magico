import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("el catálogo muestra las tarjetas de impacto y reseña debajo de la grilla", async () => {
  const [impactCard, reviewCard, page] = await Promise.all([
    readFile("src/features/shop/ImpactStoryCard.tsx", "utf8"),
    readFile("src/features/shop/CommunityReviewCard.tsx", "utf8"),
    readFile("src/features/shop/ShopPage.tsx", "utf8"),
  ]);

  assert.match(impactCard, /Button/);
  assert.match(reviewCard, /<InfoCard/);
  assert.match(reviewCard, /variant="testimonial"/);
  assert.match(reviewCard, /Julieta Castoldi/);
  assert.match(reviewCard, /julieta-castoldi\.png/);
  assert.match(
    page,
    /<ProductGrid[\s\S]+<ImpactStoryCard[\s\S]+<CommunityReviewCard[\s\S]+<ImpactFooter/,
  );
});
