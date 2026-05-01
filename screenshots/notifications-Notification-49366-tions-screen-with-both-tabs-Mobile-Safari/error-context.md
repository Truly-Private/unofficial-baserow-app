# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: notifications.spec.ts >> NotificationsScreen >> loads notifications screen with both tabs
- Location: e2e/notifications.spec.ts:50:7

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

# Page snapshot

```yaml
- generic [ref=e14]:
  - generic [ref=e16]: 
  - generic [ref=e17]: Sign in to Baserow
  - generic [ref=e18]: Connect with your Baserow account to browse and edit your tables on the go.
  - generic [ref=e19]:
    - generic [ref=e20]: Email
    - textbox "you@example.com" [ref=e21]
  - generic [ref=e22]:
    - generic [ref=e23]: Password
    - textbox "Your password" [ref=e24]
  - generic [ref=e25] [cursor=pointer]:
    - generic [ref=e26]: 
    - generic [ref=e27]: Self-hosted instance
  - generic [ref=e29] [cursor=pointer]: Sign in
  - generic [ref=e30]: Your credentials are sent directly to the Baserow API. The session token is stored on this device only.
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | 
  3   | const TEST_EMAIL = "testerson@binkmail.com";
  4   | const TEST_PASSWORD = "roshyf-rYqmyp-joggo4";
  5   | 
  6   | async function loginOnce(page: any): Promise<boolean> {
  7   |   // Check if already authenticated by navigating to a protected route
  8   |   await page.goto("/(app)/notifications");
  9   |   
  10  |   // Wait for either login or app
  11  |   await page.waitForFunction(() => {
  12  |     const html = document.body.innerHTML;
  13  |     return html.includes("Sign in to Baserow") || html.includes("Notifications") || html.includes("Your data");
  14  |   }, { timeout: 10000 });
  15  | 
  16  |   const html = await page.content();
  17  |   
  18  |   if (html.includes("Sign in to Baserow")) {
  19  |     // Need to log in
  20  |     await page.type('input[type="text"]', TEST_EMAIL, { delay: 50 }).catch(() => {});
  21  |     await page.type('input[type="password"]', TEST_PASSWORD, { delay: 50 }).catch(() => {});
  22  |     await page.click('text=Sign in', { timeout: 5000 }).catch(async () => {
  23  |       await page.click("div:has-text('Sign in')", { timeout: 5000 }).catch(() => {});
  24  |     });
  25  |     
  26  |     // Wait for auth
  27  |     await page.waitForTimeout(3000);
  28  |     
  29  |     const postLoginHtml = await page.content();
  30  |     if (postLoginHtml.includes("Sign in to Baserow")) {
  31  |       console.log("Login failed");
  32  |       return false;
  33  |     }
  34  |   }
  35  |   
  36  |   return true;
  37  | }
  38  | 
  39  | test.describe("NotificationsScreen", () => {
> 40  |   test.beforeEach(async ({ page }) => {
      |        ^ Test timeout of 30000ms exceeded while running "beforeEach" hook.
  41  |     await page.setViewportSize({ width: 375, height: 812 });
  42  |     
  43  |     // Try to use persisted auth state if available
  44  |     const authed = await loginOnce(page);
  45  |     if (!authed) {
  46  |       test.skip(true, "Authentication failed - check credentials");
  47  |     }
  48  |   });
  49  | 
  50  |   test("loads notifications screen with both tabs", async ({ page }) => {
  51  |     // Use text selectors since React Native data-testid doesn't render as HTML attr on web
  52  |     await expect(page.getByText("Notifications").first()).toBeVisible({ timeout: 5000 });
  53  |     await expect(page.getByText("Push Settings")).toBeVisible();
  54  |   });
  55  | 
  56  |   test("switches to push settings tab and shows stable controls", async ({ page }) => {
  57  |     await page.getByText("Push Settings").click();
  58  |     await expect(page.getByText("PERMISSION STATUS")).toBeVisible();
  59  |     await expect(page.getByText("NOTIFICATION TYPES")).toBeVisible();
  60  |     // Check for toggle elements by text
  61  |     await expect(page.getByText("Table updates")).toBeVisible();
  62  |     await expect(page.getByText("Mentions")).toBeVisible();
  63  |     await expect(page.getByText("Weekly digest")).toBeVisible();
  64  |   });
  65  | 
  66  |   test("shows notifications workspace picker and refresh action", async ({ page }) => {
  67  |     // Use text-based selectors for the header actions
  68  |     await expect(page.getByText("Test's workspace")).toBeVisible();
  69  |     await expect(page.getByText("Notifications")).toBeVisible();
  70  |   });
  71  | 
  72  |   test("notification actions use updated selectors when rows are present", async ({ page }) => {
  73  |     const rows = page.locator("[data-testid^='notif-row-']");
  74  |     const rowCount = await rows.count();
  75  | 
  76  |     if (rowCount > 0) {
  77  |       await expect(rows.first()).toBeVisible();
  78  |       const markReadButtons = page.locator("[data-testid^='notif-mark-read-']");
  79  |       const markReadCount = await markReadButtons.count();
  80  |       if (markReadCount > 0) {
  81  |         await expect(markReadButtons.first()).toBeVisible();
  82  |       }
  83  |     }
  84  |   });
  85  | 
  86  |   test("optional bulk actions render with stable selectors when available", async ({ page }) => {
  87  |     const markAll = page.locator("[data-testid='mark-all-read']");
  88  |     const clear = page.locator("[data-testid='clear-notifs']");
  89  |     const loadMore = page.locator("[data-testid='load-more-notifs']");
  90  | 
  91  |     if (await markAll.count()) {
  92  |       await expect(markAll).toBeVisible();
  93  |     }
  94  |     if (await clear.count()) {
  95  |       await expect(clear).toBeVisible();
  96  |     }
  97  |     if (await loadMore.count()) {
  98  |       await expect(loadMore).toBeVisible();
  99  |     }
  100 |   });
  101 | });
  102 | 
```