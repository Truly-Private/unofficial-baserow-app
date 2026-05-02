import { test, expect } from '@playwright/test';

test.describe('WorkspacesScreen', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
  });

  // ── Header ──
  test('renders header with back button and title', async ({ page }) => {
    await page.goto('http://localhost:3000/ios/workspaces');
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Workspaces')).toBeVisible();
    await expect(page.locator('[data-testid="back-btn"]')).toBeVisible();
  });

  // ── Tabs ──
  test('renders all 3 tabs', async ({ page }) => {
    await page.goto('http://localhost:3000/ios/workspaces');
    await page.waitForTimeout(2000);
    await expect(page.locator('[data-testid="tab-workspaces"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-members"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-invitations"]')).toBeVisible();
  });

  // ── Workspaces Tab ──
  test('shows "+ New" button on workspaces tab', async ({ page }) => {
    await page.goto('http://localhost:3000/ios/workspaces');
    await page.waitForTimeout(2000);
    await expect(page.locator('[data-testid="btn-create-ws"]')).toBeVisible();
  });

  test('opens create workspace modal on "+ New" tap', async ({ page }) => {
    await page.goto('http://localhost:3000/ios/workspaces');
    await page.waitForTimeout(2000);
    await page.locator('[data-testid="btn-create-ws"]').click();
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="input-ws-name"]')).toBeVisible();
    await expect(page.locator('text=Create')).toBeVisible();
  });

  test('shows workspace detail or empty state', async ({ page }) => {
    await page.goto('http://localhost:3000/ios/workspaces');
    await page.waitForTimeout(2000);
    const detail = page.locator('[data-testid="ws-detail"]');
    const empty = page.locator('[data-testid="empty-workspaces"]');
    await expect(detail.or(empty)).toBeVisible();
  });

  // ── Members Tab ──
  test('switches to Members tab', async ({ page }) => {
    await page.goto('http://localhost:3000/ios/workspaces');
    await page.waitForTimeout(2000);
    await page.locator('[data-testid="tab-members"]').click();
    await page.waitForTimeout(1000);
    const members = page.locator('[data-testid^="member-"]');
    const empty = page.locator('[data-testid="empty-members"]');
    await expect(members.or(empty)).toBeVisible();
  });

  // ── Invitations Tab ──
  test('switches to Invitations tab and shows "+ Invite" button', async ({ page }) => {
    await page.goto('http://localhost:3000/ios/workspaces');
    await page.waitForTimeout(2000);
    await page.locator('[data-testid="tab-invitations"]').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('[data-testid="btn-invite"]')).toBeVisible();
    const empty = page.locator('[data-testid="empty-invitations"]');
    const invite = page.locator('[data-testid^="invitation-"]');
    await expect(empty.or(invite)).toBeVisible();
  });

  test('opens invite modal from "+ Invite" button', async ({ page }) => {
    await page.goto('http://localhost:3000/ios/workspaces');
    await page.waitForTimeout(2000);
    await page.locator('[data-testid="tab-invitations"]').click();
    await page.waitForTimeout(500);
    await page.locator('[data-testid="btn-invite"]').click();
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="input-invite-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="invite-role-admin"]')).toBeVisible();
    await expect(page.locator('[data-testid="invite-role-member"]')).toBeVisible();
    await expect(page.locator('[data-testid="invite-role-viewer"]')).toBeVisible();
  });

  // ── Role picker ──
  test('renders role option buttons', async ({ page }) => {
    await page.goto('http://localhost:3000/ios/workspaces');
    await page.waitForTimeout(2000);
    await page.locator('[data-testid="tab-members"]').click();
    await page.waitForTimeout(1000);
    const roleBtn = page.locator('[data-testid^="btn-role-"]').first();
    if (await roleBtn.isVisible()) {
      await roleBtn.click();
      await page.waitForTimeout(500);
      await expect(page.locator('[data-testid="role-option-admin"]')).toBeVisible();
      await expect(page.locator('[data-testid="role-option-member"]')).toBeVisible();
      await expect(page.locator('[data-testid="role-option-viewer"]')).toBeVisible();
    }
  });

  // ── Delete / Leave modals ──
  test('shows edit, leave, delete buttons on selected workspace', async ({ page }) => {
    await page.goto('http://localhost:3000/ios/workspaces');
    await page.waitForTimeout(2000);
    const detail = page.locator('[data-testid="ws-detail"]');
    if (await detail.isVisible()) {
      await expect(page.locator('[data-testid="btn-edit-ws"]')).toBeVisible();
      await expect(page.locator('[data-testid="btn-leave-ws"]')).toBeVisible();
      await expect(page.locator('[data-testid="btn-delete-ws"]')).toBeVisible();
    }
  });
});
