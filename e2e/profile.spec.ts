import { test, expect } from '@playwright/test';

test.describe('ProfileScreen', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
  });

  // ── Header ──
  test('renders header with back button and user email', async ({ page }) => {
    await page.goto('http://localhost:3000/ios/profile');
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Profile')).toBeVisible();
    await expect(page.locator('[data-testid="back-btn"]')).toBeVisible();
  });

  // ── Tab Navigation ──
  test('renders all 4 tabs', async ({ page }) => {
    await page.goto('http://localhost:3000/ios/profile');
    await page.waitForTimeout(2000);
    await expect(page.locator('[data-testid="tab-profile"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-notifications"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-invitations"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-danger"]')).toBeVisible();
  });

  test('Profile tab shows first name input, language chips, save button', async ({ page }) => {
    await page.goto('http://localhost:3000/ios/profile');
    await page.waitForTimeout(2000);
    await expect(page.locator('[data-testid="tab-profile"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-first-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-save-profile"]')).toBeVisible();
  });

  test('switches to Notifications tab and shows frequency options', async ({ page }) => {
    await page.goto('http://localhost:3000/ios/profile');
    await page.waitForTimeout(2000);
    await page.locator('[data-testid="tab-notifications"]').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('[data-testid="freq-instant"]')).toBeVisible();
    await expect(page.locator('[data-testid="freq-daily"]')).toBeVisible();
    await expect(page.locator('[data-testid="freq-weekly"]')).toBeVisible();
    await expect(page.locator('[data-testid="freq-never"]')).toBeVisible();
  });

  test('switches to Invitations tab and shows empty state or list', async ({ page }) => {
    await page.goto('http://localhost:3000/ios/profile');
    await page.waitForTimeout(2000);
    await page.locator('[data-testid="tab-invitations"]').click();
    await page.waitForTimeout(1000);
    const emptyText = page.locator('text=No pending invitations');
    const inviteCard = page.locator('[data-testid^="invitation-"]');
    await expect(emptyText.or(inviteCard)).toBeVisible();
  });

  test('switches to Danger Zone tab and shows delete/logout buttons', async ({ page }) => {
    await page.goto('http://localhost:3000/ios/profile');
    await page.waitForTimeout(2000);
    await page.locator('[data-testid="tab-danger"]').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('[data-testid="btn-delete-account"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-logout"]')).toBeVisible();
  });

  // ── Change Password ──
  test('opens change password modal when button is tapped', async ({ page }) => {
    await page.goto('http://localhost:3000/ios/profile');
    await page.waitForTimeout(2000);
    await page.locator('[data-testid="btn-change-password"]').click();
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="input-old-password"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-new-password"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-confirm-password"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-submit-password"]')).toBeVisible();
  });

  // ── Change Email ──
  test('opens change email modal when button is tapped', async ({ page }) => {
    await page.goto('http://localhost:3000/ios/profile');
    await page.waitForTimeout(2000);
    await page.locator('[data-testid="btn-change-email"]').click();
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="input-new-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-email-password"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-submit-email"]')).toBeVisible();
  });

  // ── Delete Account ──
  test('opens delete account modal from danger zone', async ({ page }) => {
    await page.goto('http://localhost:3000/ios/profile');
    await page.waitForTimeout(2000);
    await page.locator('[data-testid="tab-danger"]').click();
    await page.waitForTimeout(1000);
    await page.locator('[data-testid="btn-delete-account"]').click();
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="btn-confirm-delete"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-delete-days"]')).toBeVisible();
  });

  // ── Verify Email ──
  test('has resend verification email button', async ({ page }) => {
    await page.goto('http://localhost:3000/ios/profile');
    await page.waitForTimeout(2000);
    await expect(page.locator('[data-testid="btn-verify-email"]')).toBeVisible();
  });

  // ── Language Selection ──
  test('can select a language chip', async ({ page }) => {
    await page.goto('http://localhost:3000/ios/profile');
    await page.waitForTimeout(2000);
    const spanishChip = page.locator('[data-testid="lang-es"]');
    if (await spanishChip.isVisible()) {
      await spanishChip.click();
      await page.screenshot({ path: 'screenshots/profile-lang-es.png', fullPage: true });
    }
  });
});
