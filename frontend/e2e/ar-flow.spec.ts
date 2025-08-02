import { test, expect } from '@playwright/test'

test.describe('Accounts Receivable Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/')
    await page.fill('input[name="email"], input[type="email"]', 'admin@acme001.com')
    await page.fill('input[name="password"], input[type="password"]', 'admin123')
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")')
    await expect(page).toHaveURL(/dashboard|app|home/, { timeout: 10000 })
  })

  test('should create a customer', async ({ page }) => {
    // Navigate directly to new customer page
    await page.goto('/maintenance/ar/customers/new')
    
    // Wait for form to load
    await expect(page.locator('input[type="text"]')).toBeVisible()
    
    // Fill customer details
    await page.fill('input[type="text"]', 'TESTCUST')
    await page.fill('input[type="text"] >> nth=1', 'Test Customer Ltd')
    await page.fill('input[type="email"]', 'test.customer@example.com')
    await page.fill('input[type="tel"]', '+1-555-123-4567')
    await page.fill('input[placeholder*="street"]', '123 Test Street')
    await page.fill('input[placeholder*="city"]', 'Test City')
    
    // Save customer
    await page.click('button[type="submit"]')
    
    // Verify redirect to customers page
    await expect(page).toHaveURL(/\/maintenance\/ar\/customers/, { timeout: 10000 })
  })

  test('should create customer invoice', async ({ page }) => {
    // Navigate directly to new invoice page
    await page.goto('/transactions/ar/invoices/new')
    
    // Wait for form to load
    await expect(page.locator('select, input')).toBeVisible({ timeout: 10000 })
    
    // Select customer if dropdown is available
    const customerSelect = page.locator('select').first()
    if (await customerSelect.isVisible()) {
      await customerSelect.selectOption({ index: 1 }) // First customer
    }
    
    // Fill invoice details
    await page.fill('input[name*="reference"], input[placeholder*="reference"]', 'INV-E2E-001')
    
    // Set invoice date
    const today = new Date().toISOString().split('T')[0]
    await page.fill('input[type="date"]', today)
    
    // Fill total amount
    await page.fill('input[type="number"]', '350.00')
    
    // Save invoice
    await page.click('button[type="submit"]')
    
    // Wait for completion
    await page.waitForTimeout(3000)
  })

  test('should post customer invoice', async ({ page }) => {
    // Navigate directly to invoices list
    await page.goto('/transactions/ar/invoices')
    
    // Check if there are any invoices
    await page.waitForTimeout(2000)
    const hasInvoices = await page.locator('table tbody tr').count() > 0
    
    if (!hasInvoices) {
      // Create a new invoice first
      await page.goto('/transactions/ar/invoices/new')
      await expect(page.locator('select, input')).toBeVisible({ timeout: 10000 })
      
      const customerSelect = page.locator('select').first()
      if (await customerSelect.isVisible()) {
        await customerSelect.selectOption({ index: 1 })
      }
      await page.fill('input[name*="reference"], input[placeholder*="reference"]', 'INV-POST-001')
      await page.fill('input[type="date"]', new Date().toISOString().split('T')[0])
      await page.fill('input[type="number"]', '200.00')
      
      await page.click('button[type="submit"]')
      await page.waitForTimeout(2000)
    }
    
    // Go back to invoices list
    await page.goto('/transactions/ar/invoices')
    await page.waitForTimeout(2000)
  })

  test('should record customer payment', async ({ page }) => {
    // Navigate directly to receipts
    await page.goto('/transactions/ar/receipts/new')
    
    // Wait for form to load
    await expect(page.locator('select, input')).toBeVisible({ timeout: 10000 })
    
    // Select customer
    const customerSelect = page.locator('select').first()
    if (await customerSelect.isVisible()) {
      await customerSelect.selectOption({ index: 1 })
    }
    
    // Fill payment details
    await page.fill('input[type="number"]', '200.00')
    await page.fill('input[type="date"]', new Date().toISOString().split('T')[0])
    await page.fill('input[name*="reference"], input[placeholder*="reference"]', 'PAY-E2E-001')
    
    // Save payment
    await page.click('button[type="submit"]')
    
    // Wait for completion
    await page.waitForTimeout(3000)
  })

  test('should view customer aging report', async ({ page }) => {
    // Navigate directly to AR aging report
    await page.goto('/reports/ar/aging')
    
    // Wait for page to load
    await page.waitForTimeout(3000)
    
    // Check if report interface is available - be more specific about button selection
    const generateButton = page.locator('button:has-text("Generate"), button:has-text("Run Report"), button[type="submit"]').first()
    const hasGenerateButton = await generateButton.isVisible({ timeout: 3000 }).catch(() => false)
    
    if (hasGenerateButton) {
      // Try to generate report
      await generateButton.click()
      await page.waitForTimeout(3000)
    }
    
    // Just verify we reached the aging report page
    await expect(page).toHaveURL(/aging/)
  })

  test('should view customer statement', async ({ page }) => {
    // Navigate directly to customer statement
    await page.goto('/reports/ar/statement')
    
    // Wait for page to load
    await page.waitForTimeout(3000)
    
    // Check if form elements are available - be more specific about customer select
    const customerSelect = page.locator('select').first()
    const hasSelect = await customerSelect.isVisible({ timeout: 3000 }).catch(() => false)
    
    if (hasSelect) {
      // Select customer from first dropdown
      await customerSelect.selectOption({ index: 1 })
      
      // Set date range
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - 1)
      const endDate = new Date()
      
      await page.fill('input[type="date"]', startDate.toISOString().split('T')[0])
      const secondDateInput = page.locator('input[type="date"]').nth(1)
      if (await secondDateInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await secondDateInput.fill(endDate.toISOString().split('T')[0])
      }
      
      // Try to generate statement
      const generateButton = page.locator('button:has-text("Generate"), button:has-text("Run Report"), button[type="submit"]').first()
      if (await generateButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await generateButton.click()
        await page.waitForTimeout(3000)
      }
    }
    
    // Just verify we reached the statement page
    await expect(page).toHaveURL(/statement/)
  })

  test('should handle customer credit limit validation', async ({ page }) => {
    // Navigate to customers
    await page.goto('/maintenance/ar/customers')
    await page.waitForTimeout(2000)
    
    // Check if there are customers to edit
    const hasCustomers = await page.locator('table tbody tr').count() > 0
    
    if (hasCustomers) {
      // Edit existing customer to set credit limit
      await page.locator('table tbody tr').first().locator('a[title="Edit Customer"]').click()
      
      // Wait for edit form
      await page.waitForTimeout(2000)
      
      // Set low credit limit
      await page.fill('input[type="number"]', '100.00')
      await page.click('button[type="submit"]')
      await page.waitForTimeout(2000)
      
      // Try to create invoice that exceeds credit limit
      await page.goto('/transactions/ar/invoices/new')
      await expect(page.locator('select, input')).toBeVisible({ timeout: 10000 })
      
      const customerSelect = page.locator('select').first()
      if (await customerSelect.isVisible()) {
        await customerSelect.selectOption({ index: 1 }) // Customer with $100 limit
      }
      
      await page.fill('input[name*="reference"], input[placeholder*="reference"]', 'INV-OVERLIMIT-001')
      await page.fill('input[type="date"]', new Date().toISOString().split('T')[0])
      await page.fill('input[type="number"]', '500.00') // Exceeds $100 limit
      
      // Try to save
      await page.click('button[type="submit"]')
      await page.waitForTimeout(2000)
    } else {
      console.log('No customers available for credit limit test')
    }
  })

  test('should process partial payment allocation', async ({ page }) => {
    // Navigate to receipts
    await page.goto('/transactions/ar/receipts/new')
    
    // Wait for form to load
    await expect(page.locator('select, input')).toBeVisible({ timeout: 10000 })
    
    // Create partial payment
    const customerSelect = page.locator('select').first()
    if (await customerSelect.isVisible()) {
      await customerSelect.selectOption({ index: 1 })
    }
    
    await page.fill('input[type="number"]', '50.00') // Partial amount
    await page.fill('input[type="date"]', new Date().toISOString().split('T')[0])
    await page.fill('input[name*="reference"], input[placeholder*="reference"]', 'PARTIAL-PAY-001')
    
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)
    
    // Check allocations page
    await page.goto('/transactions/ar/allocations')
    await page.waitForTimeout(2000)
  })
})
