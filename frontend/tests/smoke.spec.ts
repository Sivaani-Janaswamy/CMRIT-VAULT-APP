import { expect, test } from "@playwright/test";

test.describe("CMRIT Vault smoke", () => {
  test("public routes render", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "CMRIT Vault" })).toBeVisible();

    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /welcome/i })).toBeVisible();

    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: /create account/i })).toBeVisible();
  });

  test("protected routes redirect or render without 500", async ({ page }) => {
    const protectedRoutes = ["/subjects", "/search", "/downloads", "/faculty", "/admin"];

    for (const route of protectedRoutes) {
      const response = await page.goto(route);
      expect(response?.status()).toBeLessThan(500);
      await expect(page).toHaveURL(/\/|login|subjects|search|downloads|faculty|admin/);
    }
  });
});
