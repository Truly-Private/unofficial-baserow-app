import { test, expect } from '@playwright/test';

test.describe('Baserow Mobile App', () => {
  // Set mobile viewport
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X dimensions
  });

  test('login page loads correctly', async ({ page }) => {
    // Navigate to the login page (serving from static build)
    await page.goto('http://localhost:3000/ios/');
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/login-page.png', fullPage: true });
    
    // Check page loaded
    await expect(page).toHaveTitle(/Baserow|expo/i);
  });

  test('login with test credentials', async ({ page }) => {
    await page.goto('http://localhost:3000/ios/');
    await page.screenshot({ path: 'screenshots/before-login.png', fullPage: true });
    
    // Look for email input - try common selectors
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    
    if (await emailInput.isVisible()) {
      await emailInput.fill('testerson@binkmail.com');
      await passwordInput.fill('roshyf-rYqmyp-joggo4');
      
      await page.screenshot({ path: 'screenshots/filled-login.png', fullPage: true });
      
      // Try to submit
      const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign")');
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'screenshots/after-login.png', fullPage: true });
      }
    } else {
      console.log('Login form not found on this page');
    }
  });
});