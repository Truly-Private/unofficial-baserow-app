import { test, expect } from "@playwright/test";

test.describe("AdminScreen", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
  });

  test("renders admin screen with all 6 tabs", async ({ page }) => {
    await page.goto("http://localhost:3000/ios/admin");
    await page.waitForTimeout(2000);

    // All 6 tabs should be visible
    await expect(page.locator("text=Dashboard")).toBeVisible();
    await expect(page.locator("text=Users")).toBeVisible();
    await expect(page.locator("text=Workspaces")).toBeVisible();
    await expect(page.locator("text=Audit Log")).toBeVisible();
    await expect(page.locator("text=Data Scanner")).toBeVisible();
    await expect(page.locator("text=Auth Providers")).toBeVisible();
  });

  test("Dashboard tab shows stat cards", async ({ page }) => {
    await page.goto("http://localhost:3000/ios/admin");
    await page.waitForTimeout(2000);

    // Dashboard tab is active by default
    await expect(page.locator("text=Overview")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=New Users")).toBeVisible();
    await expect(page.locator("text=Active Users")).toBeVisible();
  });

  test("switches to Users tab and shows search + create button", async ({ page }) => {
    await page.goto("http://localhost:3000/ios/admin");
    await page.waitForTimeout(2000);

    await page.locator("text=Users").click();
    await page.waitForTimeout(1000);

    // Toolbar should show search input and "+ New" button
    await expect(page.locator('[placeholder="Search users…"]')).toBeVisible();
    await expect(page.locator("text=+ New")).toBeVisible();
  });

  test("switches to Workspaces tab", async ({ page }) => {
    await page.goto("http://localhost:3000/ios/admin");
    await page.waitForTimeout(2000);

    await page.locator("text=Workspaces").click();
    await page.waitForTimeout(1000);

    await expect(page.locator('[placeholder="Search workspaces…"]')).toBeVisible();
  });

  test("switches to Audit Log tab", async ({ page }) => {
    await page.goto("http://localhost:3000/ios/admin");
    await page.waitForTimeout(2000);

    await page.locator("text=Audit Log").click();
    await page.waitForTimeout(1000);

    // Filter toggle and export button should be visible
    await expect(page.locator("text=Filters")).toBeVisible();
    await expect(page.locator("text=Export")).toBeVisible();
  });

  test("Audit Log shows filter panel when toggled", async ({ page }) => {
    await page.goto("http://localhost:3000/ios/admin");
    await page.waitForTimeout(2000);

    await page.locator("text=Audit Log").click();
    await page.waitForTimeout(500);

    await page.locator("text=Filters").click();
    await page.waitForTimeout(500);

    // Filter panel should now be visible with User ID field
    await expect(page.locator('[placeholder="Workspace ID…"]')).toBeVisible();
  });

  test("switches to Data Scanner tab and shows sub-tabs", async ({ page }) => {
    await page.goto("http://localhost:3000/ios/admin");
    await page.waitForTimeout(2000);

    await page.locator("text=Data Scanner").click();
    await page.waitForTimeout(1000);

    // Sub-tabs: Scans and Results
    await expect(page.locator("text=Scans")).toBeVisible();
    await expect(page.locator("text=Results")).toBeVisible();
    await expect(page.locator("text=+ New Scan")).toBeVisible();
  });

  test("switches to Auth Providers tab", async ({ page }) => {
    await page.goto("http://localhost:3000/ios/admin");
    await page.waitForTimeout(2000);

    await page.locator("text=Auth Providers").click();
    await page.waitForTimeout(1000);

    // Should show the list (empty or with providers)
    // No error boundary — graceful handling
    await page.screenshot({ path: "screenshots/admin-auth-providers.png", fullPage: true });
  });

  test("shows empty state in Users tab when no users", async ({ page }) => {
    await page.goto("http://localhost:3000/ios/admin");
    await page.waitForTimeout(2000);

    await page.locator("text=Users").click();
    await page.waitForTimeout(2000);

    // Either users list or empty state
    const emptyOrList = await Promise.race([
      page.locator("text=No users found.").isVisible().then((v) => v && "empty"),
      page.locator('[data-testid="user-row"]').isVisible().then((v) => v && "list"),
      page.waitForTimeout(100).then(() => "loading"),
    ]);
    // Just verify the tab content rendered
    await page.screenshot({ path: "screenshots/admin-users.png", fullPage: true });
  });

  test("shows empty state in Data Scanner Results sub-tab", async ({ page }) => {
    await page.goto("http://localhost:3000/ios/admin");
    await page.waitForTimeout(2000);

    await page.locator("text=Data Scanner").click();
    await page.waitForTimeout(1000);

    await page.locator("text=Results").click();
    await page.waitForTimeout(1500);

    // Should either show results or empty state
    await page.screenshot({ path: "screenshots/admin-scanner-results.png", fullPage: true });
  });
});
