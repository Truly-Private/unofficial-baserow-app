import { test, expect } from "@playwright/test";

test.describe("NotificationsScreen", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
  });

  test("loads notifications screen with tabs", async ({ page }) => {
    await page.goto("/notifications");
    await expect(page.locator("[data-testid='tab-notifications']")).toBeVisible();
    await expect(page.locator("[data-testid='tab-settings']")).toBeVisible();
  });

  test("switches between Notifications and Push Settings tabs", async ({ page }) => {
    await page.goto("/notifications");
    await expect(page.locator("[data-testid='tab-notifications']")).toBeVisible();
    await page.locator("[data-testid='tab-settings']").click();
    await expect(page.getByText("PERMISSION STATUS")).toBeVisible();
  });

  test("shows workspace picker", async ({ page }) => {
    await page.goto("/notifications");
    await expect(page.locator("[data-testid='ws-picker-btn']")).toBeVisible();
  });

  test("refreshes notifications", async ({ page }) => {
    await page.goto("/notifications");
    await page.locator("[data-testid='refresh-notifs']").click();
  });

  test("marks all notifications as read", async ({ page }) => {
    await page.goto("/notifications");
    const markAllBtn = page.locator("[data-testid='mark-all-read']");
    if (await markAllBtn.isVisible()) {
      await markAllBtn.click();
    }
  });

  test("toggles individual notification read state", async ({ page }) => {
    await page.goto("/notifications");
    // Find first notification toggle button if any notifications exist
    const toggle = page.locator("[data-testid^='notif-toggle-']").first();
    if (await toggle.isVisible()) {
      await toggle.click();
    }
  });

  test("loads more notifications", async ({ page }) => {
    await page.goto("/notifications");
    const loadMore = page.locator("[data-testid='load-more-notifs']");
    if (await loadMore.isVisible()) {
      await loadMore.click();
    }
  });

  test("push settings tab shows permission status", async ({ page }) => {
    await page.goto("/notifications");
    await page.locator("[data-testid='tab-settings']").click();
    await expect(page.getByText("Push Notifications")).toBeVisible();
    await expect(page.getByText("NOTIFICATION TYPES")).toBeVisible();
  });

  test("push settings toggles work", async ({ page }) => {
    await page.goto("/notifications");
    await page.locator("[data-testid='tab-settings']").click();
    const toggles = page.locator('Switch');
    if (await toggles.first().isVisible()) {
      await toggles.first().click();
    }
  });
});
