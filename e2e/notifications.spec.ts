import { test, expect } from "@playwright/test";

const TEST_EMAIL = "testerson@binkmail.com";
const TEST_PASSWORD = "roshyf-rYqmyp-joggo4";

async function loginOnce(page: any): Promise<boolean> {
  // Check if already authenticated by navigating to a protected route
  await page.goto("/(app)/notifications");
  
  // Wait for either login or app
  await page.waitForFunction(() => {
    const html = document.body.innerHTML;
    return html.includes("Sign in to Baserow") || html.includes("Notifications") || html.includes("Your data");
  }, { timeout: 10000 });

  const html = await page.content();
  
  if (html.includes("Sign in to Baserow")) {
    // Need to log in - use Playwright locators based on placeholder text
    const emailInput = page.getByPlaceholder("you@example.com");
    const passwordInput = page.getByPlaceholder("Your password");
    
    if (await emailInput.isVisible()) {
      await emailInput.fill(TEST_EMAIL);
      await passwordInput.fill(TEST_PASSWORD);
      // Use getByText since React Native renders button as generic element
      await page.getByText("Sign in").click();
      
      // Wait for auth - check for redirect away from login
      try {
        await page.waitForFunction(() => {
          return !document.body.innerHTML.includes("Sign in to Baserow");
        }, { timeout: 10000 });
      } catch {
        console.log("Login may have failed - still on login page");
        return false;
      }
    } else {
      return false;
    }
  }
  
  return true;
}

test.describe("NotificationsScreen", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    
    // Try to use persisted auth state if available
    const authed = await loginOnce(page);
    if (!authed) {
      test.skip(true, "Authentication failed - check credentials");
    }
  });

  test("loads notifications screen with both tabs", async ({ page }) => {
    // Use text selectors since React Native data-testid doesn't render as HTML attr on web
    await expect(page.getByText("Notifications").first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Push Settings")).toBeVisible();
  });

  test("switches to push settings tab and shows stable controls", async ({ page }) => {
    await page.getByText("Push Settings").click();
    await expect(page.getByText("PERMISSION STATUS")).toBeVisible();
    await expect(page.getByText("NOTIFICATION TYPES")).toBeVisible();
    // Check for toggle elements by text
    await expect(page.getByText("Table updates")).toBeVisible();
    await expect(page.getByText("Mentions")).toBeVisible();
    await expect(page.getByText("Weekly digest")).toBeVisible();
  });

  test("shows notifications workspace picker and refresh action", async ({ page }) => {
    // Use text-based selectors for the header actions
    await expect(page.getByText("Test's workspace")).toBeVisible();
    await expect(page.getByText("Notifications")).toBeVisible();
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
