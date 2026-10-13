import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Rating y RatingInput se consumen desde react-ui sin duplicar la primitiva", async () => {
  const [productCard, feedback, thanks, modalDemo, ratingPage, uiIndex] =
    await Promise.all([
      readFile("src/components/cards/ProductCard.tsx", "utf8"),
      readFile("src/features/orders/OrderReceiptFeedback.tsx", "utf8"),
      readFile("src/features/orders/FeedbackThanksModal.tsx", "utf8"),
      readFile("src/app/ui-system/modal/ModalDemo.tsx", "utf8"),
      readFile("src/app/ui-system/rating/page.tsx", "utf8"),
      readFile("src/components/ui/index.ts", "utf8"),
    ]);

  assert.match(productCard, /Rating[\s\S]*from "@pueblo-magico\/react-ui"/);
  assert.match(feedback, /RatingInput[\s\S]*from "@pueblo-magico\/react-ui"/);
  assert.match(feedback, /onChange=\{\(value\) => setRating\(value \?\? 0\)\}/);
  assert.match(feedback, /isDisabled=\{saving\}/);
  assert.match(thanks, /Rating[\s\S]*from "@pueblo-magico\/react-ui"/);
  assert.match(modalDemo, /Rating[\s\S]*from "@pueblo-magico\/react-ui"/);
  assert.match(
    ratingPage,
    /Rating, RatingInput[\s\S]*@pueblo-magico\/react-ui/,
  );
  assert.doesNotMatch(uiIndex, /\.\/Rating/);
});
