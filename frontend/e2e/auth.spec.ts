import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display login form on landing page', async ({ page }) => {
    await expect(page).toHaveTitle(/Login|BIWI|Vinea ERP/)
    await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"], input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[name="email"], input[type="email"]', 'invalid@example.com')
    await page.fill('input[name="password"], input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")')
    
    // Wait for error message
    await expect(page.locator('text="Invalid email or password"')).toBeVisible({ timeout: 5000 })
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    // Use admin credentials - adjust these based on your test data
    await page.fill('input[name="email"], input[type="email"]', 'admin@acme001.com')
    await page.fill('input[name="password"], input[type="password"]', 'admin123')
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")')
    
    // Wait for redirect to dashboard or main application
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 })
    
    // Check for dashboard elements
    await expect(page.locator('text="Welcome to Vinea ERP"')).toBeVisible()
  })

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.fill('input[name="email"], input[type="email"]', 'admin@acme001.com')
    await page.fill('input[name="password"], input[type="password"]', 'admin123')
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")')
    
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 })
    
    // Find and click logout button
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), .logout')
    if (await logoutButton.isVisible()) {
      await logoutButton.click()
    } else {
      // Try user menu first
      await page.click('.user-menu, .profile-menu, [aria-label="User menu"]')
      await page.click('button:has-text("Logout"), button:has-text("Sign Out")')
    }
    
    // Should redirect to login page
    await expect(page).toHaveURL(/login|\//, { timeout: 5000 })
    await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible()
  })

  test('should handle session expiry', async ({ page }) => {
    // Login first
    await page.fill('input[name="email"], input[type="email"]', 'admin@acme001.com')
    await page.fill('input[name="password"], input[type="password"]', 'admin123')
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")')
    
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 })
    
    // Clear session storage/cookies to simulate session expiry
    await page.context().clearCookies()
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    
    // Try to access a protected route
    await page.goto('/dashboard')
    
    // Should redirect to login
    await expect(page).toHaveURL(/login|\//, { timeout: 5000 })
  })
})
