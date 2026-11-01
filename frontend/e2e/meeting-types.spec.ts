import { expect, test } from "@playwright/test";

test("owner sees the seeded meeting types on their page", async ({ page }) => {
  await page.goto("/meeting-types");

  await expect(page.getByRole("heading", { level: 1, name: "Типы встреч" })).toBeVisible();

  const item = page.getByRole("main").getByRole("listitem").filter({ hasText: "Кофе с гостем" });
  await expect(item).toHaveCount(1);
  await expect(item).toContainText("30 мин");
  await expect(page.getByText("Типов встреч пока нет")).toHaveCount(0);
});
