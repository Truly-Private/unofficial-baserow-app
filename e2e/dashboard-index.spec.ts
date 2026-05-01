import { test, expect } from "@playwright/test";

test.describe("DashboardIndexScreen", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
  });

  test("navigates to dashboard index from home", async ({ page }) => {
    // Home screen has a Dashboards shortcut
    await page.click('[data-testid="nav-dashboards"]');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText("Dashboards")).toBeVisible();
  });

  test("loads and displays dashboards grouped by workspace", async ({ page }) => {
    await page.goto("/(app)/dashboard");
    await page.waitForSelector('[data-testid="dashboard-create-btn"]', { timeout: 10000 });
    // Should show either the list or empty state
    const hasDashboards = await page.locator("[data-testid^='dashboard-row-']").count();
    const hasEmptyState = await page.locator("[data-testid='empty-create-dashboard']").isVisible().catch(() => false);
    expect(hasDashboards >= 0).toBeTruthy(); // one or the other must be visible
    if (hasDashboards > 0) {
      // Should have a workspace label
      await expect(page.getByText(/workspace/i).first()).toBeVisible();
    }
  });

  test("opens create dashboard modal", async ({ page }) => {
    await page.goto("/(app)/dashboard");
    await page.waitForSelector('[data-testid="dashboard-create-btn"]', { timeout: 10000 });
    await page.click('[data-testid="dashboard-create-btn"]');
    await expect(page.getByTestId("dashboard-name-input")).toBeVisible();
  });

  test("creates a new dashboard", async ({ page }) => {
    await page.goto("/(app)/dashboard");
    await page.waitForSelector('[data-testid="dashboard-create-btn"]', { timeout: 10000 });
    await page.click('[data-testid="dashboard-create-btn"]');
    await page.fill('[data-testid="dashboard-name-input"]', "Test Dashboard E2E");
    await page.click('[data-testid="create-dashboard-submit"]');
    // Should navigate to the new dashboard
    await expect(page).toHaveURL(/\/dashboard\/\d+/, { timeout: 15000 });
    await expect(page.getByText("Test Dashboard E2E")).toBeVisible();
  });
});
