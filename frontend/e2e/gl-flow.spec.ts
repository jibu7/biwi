import { test, expect } from '@playwright/test'

test.describe('General Ledger Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/')
    await page.fill('input[name="email"], input[type="email"]', 'admin@acme001.com')
    await page.fill('input[name="password"], input[type="password"]', 'admin123')
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")')
    await expect(page).toHaveURL(/dashboard|app|home/, { timeout: 10000 })
  })

  test('should navigate to GL journal entries', async ({ page }) => {
    // Navigate to GL module
    await page.click('text=General Ledger, text=GL, nav >> text=General Ledger')
    await page.click('text=Journal Entries, text=Journals')
    
    await expect(page).toHaveURL(/gl|journal|general-ledger/)
    await expect(page.locator('h1, h2, .page-title')).toContainText(/Journal|GL|General Ledger/)
  })

  test('should create a new journal entry', async ({ page }) => {
    // Navigate to GL journal entries
    await page.click('text=General Ledger, text=GL, nav >> text=General Ledger')
    await page.click('text=Journal Entries, text=Journals')
    
    // Click create new journal entry
    await page.click('button:has-text("New"), button:has-text("Create"), button:has-text("Add")')
    
    // Fill journal entry details
    await page.fill('input[name="reference"], input[placeholder*="reference"]', 'TEST-JE-001')
    await page.fill('textarea[name="description"], input[name="description"]', 'Test journal entry for E2E testing')
    
    // Add journal lines
    // First line - Debit
    await page.click('button:has-text("Add Line"), .add-line')
    await page.selectOption('select[name*="account"], .account-select >> first', '1000') // Cash account
    await page.fill('input[name*="debit"]:visible >> first', '1000.00')
    
    // Second line - Credit
    await page.click('button:has-text("Add Line"), .add-line')
    await page.selectOption('select[name*="account"], .account-select >> nth=1', '4000') // Revenue account
    await page.fill('input[name*="credit"]:visible >> first', '1000.00')
    
    // Save journal entry
    await page.click('button:has-text("Save"), button[type="submit"]')
    
    // Verify success
    await expect(page.locator('text=Journal entry created, text=Success')).toBeVisible({ timeout: 5000 })
  })

  test('should post a journal entry', async ({ page }) => {
    // Navigate to GL journal entries
    await page.click('text=General Ledger, text=GL, nav >> text=General Ledger')
    await page.click('text=Journal Entries, text=Journals')
    
    // Find an unposted entry or create one first
    const unpostedEntry = page.locator('tr:has-text("Draft"), tr:has-text("Unposted")').first()
    
    if (await unpostedEntry.count() === 0) {
      // Create a new entry first
      await page.click('button:has-text("New"), button:has-text("Create")')
      await page.fill('input[name="reference"]', 'TEST-POST-001')
      await page.fill('textarea[name="description"]', 'Test entry for posting')
      
      // Add lines
      await page.click('button:has-text("Add Line")')
      await page.selectOption('select[name*="account"] >> first', '1000') // Cash account
      await page.fill('input[name*="debit"]:visible >> first', '500.00')
      
      await page.click('button:has-text("Add Line")')
      await page.selectOption('select[name*="account"] >> nth=1', '4000') // Revenue account
      await page.fill('input[name*="credit"]:visible >> first', '500.00')
      
      await page.click('button:has-text("Save")')
      await expect(page.locator('text=created, text=Success')).toBeVisible()
    }
    
    // Post the entry
    await page.click('tr:has-text("Draft"), tr:has-text("Unposted") >> button:has-text("Post"), .post-button')
    
    // Confirm posting if confirmation dialog appears
    const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")')
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click()
    }
    
    // Verify posting success
    await expect(page.locator('text=Posted, text=Success')).toBeVisible({ timeout: 5000 })
  })

  test('should view trial balance', async ({ page }) => {
    // Navigate to reports
    await page.click('text=Reports, text=General Ledger, nav >> text=Reports')
    await page.click('text=Trial Balance')
    
    await expect(page).toHaveURL(/trial-balance|reports/)
    
    // Check that trial balance loads
    await expect(page.locator('table, .trial-balance')).toBeVisible({ timeout: 10000 })
    
    // Verify headers
    await expect(page.locator('text=Account, text=Debit, text=Credit')).toBeVisible()
    
    // Check for balancing (total debits should equal total credits)
    const totalDebits = await page.locator('.total-debits, tfoot td:nth-child(2)').textContent()
    const totalCredits = await page.locator('.total-credits, tfoot td:nth-child(3)').textContent()
    
    if (totalDebits && totalCredits) {
      // Remove currency symbols and compare
      const debits = parseFloat(totalDebits.replace(/[^0-9.-]+/g, ''))
      const credits = parseFloat(totalCredits.replace(/[^0-9.-]+/g, ''))
      expect(Math.abs(debits - credits)).toBeLessThan(0.01) // Allow for rounding
    }
  })

  test('should generate account statement', async ({ page }) => {
    // Navigate to reports
    await page.click('text=Reports, text=General Ledger')
    await page.click('text=Account Statement, text=Ledger')
    
    // Select an account
    await page.selectOption('select[name*="account"], .account-select', '1000') // Cash account
    
    // Set date range
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 1)
    const endDate = new Date()
    
    await page.fill('input[type="date"]:first, input[name*="start"]', startDate.toISOString().split('T')[0])
    await page.fill('input[type="date"]:last, input[name*="end"]', endDate.toISOString().split('T')[0])
    
    // Generate report
    await page.click('button:has-text("Generate"), button:has-text("Run Report")')
    
    // Verify report loads
    await expect(page.locator('table, .account-statement')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Beginning Balance, text=Date, text=Description')).toBeVisible()
  })

  test('should handle GL validation errors', async ({ page }) => {
    // Navigate to GL journal entries
    await page.click('text=General Ledger, text=GL')
    await page.click('text=Journal Entries, text=Journals')
    
    // Try to create entry without required fields
    await page.click('button:has-text("New"), button:has-text("Create")')
    
    // Leave reference empty and try to save
    await page.click('button:has-text("Save"), button[type="submit"]')
    
    // Should show validation errors
    await expect(page.locator('text=Reference is required, text=required, .error')).toBeVisible({ timeout: 3000 })
    
    // Add reference but unbalanced entries
    await page.fill('input[name="reference"]', 'TEST-UNBAL-001')
    await page.fill('textarea[name="description"]', 'Unbalanced entry test')
    
    // Add only debit line
    await page.click('button:has-text("Add Line")')
    await page.selectOption('select[name*="account"] >> first', '1000') // Cash account
    await page.fill('input[name*="debit"]:visible >> first', '100.00')
    
    // Try to save unbalanced entry
    await page.click('button:has-text("Save")')
    
    // Should show balance error
    await expect(page.locator('text=unbalanced, text=debits must equal credits, .error')).toBeVisible({ timeout: 3000 })
  })
})
