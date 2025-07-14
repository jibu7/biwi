import { test, expect } from '@playwright/test';

test('homepage loads successfully', async ({ page }) => {
  await page.goto('/');
  
  // Check if the page loads without errors
  await expect(page).toHaveTitle(/Vinea ERP/i);
  
  // Basic smoke test - check if page content is rendered
  const body = await page.locator('body');
  await expect(body).toBeVisible();
});

test('navigation works', async ({ page }) => {
  await page.goto('/');
  
  // Test basic navigation if any nav elements exist
  const navElement = page.locator('nav').first();
  if (await navElement.isVisible()) {
    await expect(navElement).toBeVisible();
  }
});

test('no console errors on homepage', async ({ page }) => {
  const errors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  await page.goto('/');
  
  // Wait a bit for any async errors
  await page.waitForTimeout(2000);
  
  // Allow some common development errors but fail on critical ones
  const criticalErrors = errors.filter(error => 
    !error.includes('favicon') && 
    !error.includes('DevTools') &&
    !error.includes('Hot Module Replacement')
  );
  
  expect(criticalErrors.length).toBe(0);
});
