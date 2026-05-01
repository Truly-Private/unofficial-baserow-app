import { test, expect } from '@playwright/test';

test.describe('RowCommentsScreen', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
  });

  test('renders empty state when no comments exist', async ({ page }) => {
    await page.goto('http://localhost:3000/ios/row-comments/1/1');
    await page.waitForTimeout(1500);

    const emptyText = page.locator('text=No comments yet');
    await expect(emptyText).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'screenshots/row-comments-empty.png', fullPage: true });
  });

  test('shows header with back button and notification mode toggle', async ({ page }) => {
    await page.goto('http://localhost:3000/ios/row-comments/1/1');
    await page.waitForTimeout(1500);

    await expect(page.locator('text=Comments')).toBeVisible();
    await expect(page.locator('[data-testid="back-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="notification-mode-btn"]')).toBeVisible();
    await page.screenshot({ path: 'screenshots/row-comments-header.png', fullPage: true });
  });

  test('can type and submit a new comment', async ({ page }) => {
    await page.goto('http://localhost:3000/ios/row-comments/1/1');
    await page.waitForTimeout(1500);

    const input = page.locator('[data-testid="new-comment-input"]');
    await expect(input).toBeVisible();
    await input.fill('This is a test comment from Playwright');
    await page.locator('[data-testid="send-comment-btn"]').click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/row-comments-after-submit.png', fullPage: true });

    const comment = page.locator('text=This is a test comment from Playwright');
    await expect(comment).toBeVisible({ timeout: 5000 });
  });

  test('can open notification mode modal', async ({ page }) => {
    await page.goto('http://localhost:3000/ios/row-comments/1/1');
    await page.waitForTimeout(1500);

    await page.locator('[data-testid="notification-mode-btn"]').click();
    await page.waitForTimeout(500);

    await expect(page.locator('text=Notification Mode')).toBeVisible();
    await expect(page.locator('[data-testid="mode-all"]')).toBeVisible();
    await expect(page.locator('[data-testid="mode-mentions"]')).toBeVisible();
    await page.screenshot({ path: 'screenshots/row-comments-mode-modal.png', fullPage: true });

    await page.locator('text=Cancel').click();
    await page.waitForTimeout(300);
  });

  test('comment card shows edit and delete actions', async ({ page }) => {
    await page.goto('http://localhost:3000/ios/row-comments/1/1');
    await page.waitForTimeout(2000);

    // Submit a comment first
    await page.locator('[data-testid="new-comment-input"]').fill('Comment to edit/delete');
    await page.locator('[data-testid="send-comment-btn"]').click();
    await page.waitForTimeout(2500);

    const editBtn = page.locator('[data-testid^="comment-edit-"]').first();
    await expect(editBtn).toBeVisible();

    const deleteBtn = page.locator('[data-testid^="comment-delete-"]').first();
    await expect(deleteBtn).toBeVisible();
    await page.screenshot({ path: 'screenshots/row-comments-actions.png', fullPage: true });
  });
});
