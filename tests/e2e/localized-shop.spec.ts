import { expect, test } from "@playwright/test";

test("redirige la portada en español al catálogo localizado", async ({
  page,
}) => {
  await page.goto("/es");

  await expect(page).toHaveURL(/\/es\/tienda$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Todos los productos" }),
  ).toBeVisible();
});
