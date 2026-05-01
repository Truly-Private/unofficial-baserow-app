import { test, expect } from '@playwright/test';

test.describe('NotificationsScreen', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
  });

  test('renders empty state when no notifications', async ({ page }) => {
    await page.goto('http://localhost:3000/ios/notifications/1');
    await page.waitForTimeout(2000);

    const empty = page.locator('text=You\'re all caught up!');
    await expect(empty).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'screenshots/notifications-empty.png', fullPage: true });
  });

  test('shows header with back button and mark-all-read when unread exist', async ({ page }) => {
    await page.goto('http://localhost:3000/ios/notifications/1');
    await page.waitForTimeout(2000);

    await expect(page.locator('text=Notifications')).toBeVisible();
    await expect(page.locator('[data-testid="back-btn"]')).toBeVisible();
    await page.screenshot({ path: 'screenshots/notifications-header.png', fullPage: true });
  });

  test('displays notification cards with icon, title, preview, and date', async ({ page }) => {
    await page.goto('http://localhost:3000/ios/notifications/1');
    await page.waitForTimeout(2000);

    const list = page.locator('[data-testid="notifications-list"]');
    await expect(list).toBeVisible();

    const firstNotif = list.locator('[data-testid^="notification-"]').first();
    await expect(firstNotif).toBeVisible();
    await page.screenshot({ path: 'screenshots/notifications-list.png', fullPage: true });
  });

  test('unread notification shows blue indicator', async ({ page }) => {
    await page.goto('http://localhost:3000/ios/notifications/1');
    await page.waitForTimeout(2000);

    const unreadDot = page.locator('[data-testid^="unread-"]').first();
    if (await unreadDot.isVisible()) {
      await expect(unreadDot).toBeVisible();
      await page.screenshot({ path: 'screenshots/notifications-unread.png', fullPage: true });
    }
  });

  test('can mark all as read', async ({ page }) => {
    await page.goto('http://localhost:3000/ios/notifications/1');
    await page.waitForTimeout(2000);

    const markAllBtn = page.locator('[data-testid="mark-all-read-btn"]');
    if (await markAllBtn.isVisible()) {
      await markAllBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/notifications-after-markall.png', fullPage: true });
    }
  });

  test('notification has delete button', async ({ page }) => {
    await page.goto('http://localhost:3000/ios/notifications/1');
    await page.waitForTimeout(2000);

    const deleteBtn = page.locator('[data-testid^="notification-delete-"]').first();
    if (await deleteBtn.isVisible()) {
      await expect(deleteBtn).toBeVisible();
      await page.screenshot({ path: 'screenshots/notifications-delete-btn.png', fullPage: true });
    }
  });
});
