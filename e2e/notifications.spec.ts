import { test, expect } from "@playwright/test";

test.describe("NotificationsScreen", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/(app)/notifications");
  });

  test("loads notifications screen with both tabs", async ({ page }) => {
    await expect(page.locator("[data-testid='tab-notifications']")).toBeVisible();
    await expect(page.locator("[data-testid='tab-settings']")).toBeVisible();
  });

  test("switches to push settings tab and shows stable controls", async ({ page }) => {
    await page.locator("[data-testid='tab-settings']").click();
    await expect(page.getByText("PERMISSION STATUS")).toBeVisible();
    await expect(page.getByText("NOTIFICATION TYPES")).toBeVisible();
    await expect(page.locator("[data-testid='push-toggle-table-updates']")).toBeVisible();
    await expect(page.locator("[data-testid='push-toggle-mentions']")).toBeVisible();
    await expect(page.locator("[data-testid='push-toggle-weekly-digest']")).toBeVisible();
  });

  test("shows notifications workspace picker and refresh action", async ({ page }) => {
    await expect(page.locator("[data-testid='ws-picker-btn']")).toBeVisible();
    await expect(page.locator("[data-testid='refresh-notifs']")).toBeVisible();
  });

  test("notification actions use updated selectors when rows are present", async ({ page }) => {
    const rows = page.locator("[data-testid^='notif-row-']");
    const rowCount = await rows.count();

    if (rowCount > 0) {
      await expect(rows.first()).toBeVisible();
      const markReadButtons = page.locator("[data-testid^='notif-mark-read-']");
      const markReadCount = await markReadButtons.count();
      if (markReadCount > 0) {
        await expect(markReadButtons.first()).toBeVisible();
      }
    }
  });

  test("optional bulk actions render with stable selectors when available", async ({ page }) => {
    const markAll = page.locator("[data-testid='mark-all-read']");
    const clear = page.locator("[data-testid='clear-notifs']");
    const loadMore = page.locator("[data-testid='load-more-notifs']");

    if (await markAll.count()) {
      await expect(markAll).toBeVisible();
    }
    if (await clear.count()) {
      await expect(clear).toBeVisible();
    }
    if (await loadMore.count()) {
      await expect(loadMore).toBeVisible();
    }
  });
});
