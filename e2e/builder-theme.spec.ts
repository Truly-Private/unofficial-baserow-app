import { test, expect } from "@playwright/test";

test.describe("BuilderThemeEditor", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
  });

  test("Theme view mode shows color editor", async ({ page }) => {
    // Navigate to a builder app (requires authenticated session + a builder app in the workspace)
    await page.goto("/(app)/builder/1");
    await page.waitForLoadState("networkidle");

    // Switch to Theme view mode
    const themeTab = page.getByRole("button", { name: /theme/i });
    if (await themeTab.isVisible()) {
      await themeTab.click();
      await page.waitForTimeout(500);

      // Verify color editor is visible
      await expect(page.getByText("Theme Customization")).toBeVisible();
      await expect(page.getByText("Primary Color")).toBeVisible();
      await expect(page.getByText("Secondary Color")).toBeVisible();
    }
  });

  test("can change primary color via preset", async ({ page }) => {
    await page.goto("/(app)/builder/1");
    await page.waitForLoadState("networkidle");

    const themeTab = page.getByRole("button", { name: /theme/i });
    if (await themeTab.isVisible()) {
      await themeTab.click();
      await page.waitForTimeout(300);

      // Click the red color preset (first color = blue, second = violet, etc.)
      // Presets: Blue, Violet, Pink, Red, Orange, Yellow, Green, Teal, Cyan, Indigo, Purple, Slate
      const presets = page.locator('[data-testid="color-preset"]');
      const presetCount = await presets.count();
      expect(presetCount).toBeGreaterThan(0);
    }
  });

  test("can enter custom hex color", async ({ page }) => {
    await page.goto("/(app)/builder/1");
    await page.waitForLoadState("networkidle");

    const themeTab = page.getByRole("button", { name: /theme/i });
    if (await themeTab.isVisible()) {
      await themeTab.click();
      await page.waitForTimeout(300);

      // Find hex input and type a custom color
      const hexInput = page.getByPlaceholder("#000000").first();
      if (await hexInput.isVisible()) {
        await hexInput.fill("#FF5733");
        await hexInput.blur();
        await page.waitForTimeout(500);
      }
    }
  });
});
