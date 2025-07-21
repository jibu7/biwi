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
    // Navigate to customers
    await page.click('text=Customers, text=AR, nav >> text=Customers')
    
    // Create new customer
    await page.click('button:has-text("New"), button:has-text("Add Customer")')
    
    // Fill customer details
    await page.fill('input[name="name"], input[name="customer_name"]', 'Test Customer Ltd')
    await page.fill('input[name="email"]', 'test.customer@example.com')
    await page.fill('input[name="phone"]', '+1-555-123-4567')
    await page.fill('textarea[name="address"], input[name="address"]', '123 Test Street, Test City, TC 12345')
    
    // Save customer
    await page.click('button:has-text("Save"), button[type="submit"]')
    
    // Verify success
    await expect(page.locator('text=Customer created, text=Success')).toBeVisible({ timeout: 5000 })
  })

  test('should create customer invoice', async ({ page }) => {
    // Navigate to invoices
    await page.click('text=Invoices, text=AR, nav >> text=Invoices')
    
    // Create new invoice
    await page.click('button:has-text("New"), button:has-text("Create Invoice")')
    
    // Select customer
    await page.selectOption('select[name*="customer"], .customer-select', '1') // First customer
    
    // Fill invoice details
    await page.fill('input[name="invoice_number"], input[name="reference"]', 'INV-E2E-001')
    
    // Set invoice date
    const today = new Date().toISOString().split('T')[0]
    await page.fill('input[type="date"], input[name*="date"]', today)
    
    // Add invoice lines
    await page.click('button:has-text("Add Line"), .add-line')
    await page.fill('input[name*="description"]:visible >> first', 'Test Product A')
    await page.fill('input[name*="quantity"]:visible >> first', '2')
    await page.fill('input[name*="price"], input[name*="unit_price"]:visible >> first', '100.00')
    
    await page.click('button:has-text("Add Line"), .add-line')
    await page.fill('input[name*="description"]:visible >> nth=1', 'Test Service B')
    await page.fill('input[name*="quantity"]:visible >> nth=1', '1')
    await page.fill('input[name*="price"], input[name*="unit_price"]:visible >> nth=1', '150.00')
    
    // Save invoice
    await page.click('button:has-text("Save"), button[type="submit"]')
    
    // Verify success
    await expect(page.locator('text=Invoice created, text=Success')).toBeVisible({ timeout: 5000 })
  })

  test('should post customer invoice', async ({ page }) => {
    // Navigate to invoices
    await page.click('text=Invoices, text=AR')
    
    // Find a draft invoice or create one
    const draftInvoice = page.locator('tr:has-text("Draft"), tr:has-text("Unposted")').first()
    
    if (await draftInvoice.count() === 0) {
      // Create a new invoice first
      await page.click('button:has-text("New")')
      await page.selectOption('select[name*="customer"]', '1')
      await page.fill('input[name="invoice_number"]', 'INV-POST-001')
      await page.fill('input[type="date"]', new Date().toISOString().split('T')[0])
      
      await page.click('button:has-text("Add Line")')
      await page.fill('input[name*="description"]:visible >> first', 'Test Item')
      await page.fill('input[name*="quantity"]:visible >> first', '1')
      await page.fill('input[name*="price"]:visible >> first', '200.00')
      
      await page.click('button:has-text("Save")')
      await expect(page.locator('text=created')).toBeVisible()
    }
    
    // Post the invoice
    await page.click('tr:has-text("Draft") >> button:has-text("Post"), .post-button')
    
    // Confirm posting if needed
    const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")')
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click()
    }
    
    // Verify posting success
    await expect(page.locator('text=Invoice posted, text=Posted successfully')).toBeVisible({ timeout: 5000 })
  })

  test('should record customer payment', async ({ page }) => {
    // Navigate to payments
    await page.click('text=Payments, text=AR, nav >> text=Payments')
    
    // Create new payment
    await page.click('button:has-text("New"), button:has-text("Record Payment")')
    
    // Select customer
    await page.selectOption('select[name*="customer"], .customer-select', '1')
    
    // Fill payment details
    await page.fill('input[name="amount"]', '200.00')
    await page.fill('input[type="date"], input[name*="date"]', new Date().toISOString().split('T')[0])
    await page.selectOption('select[name*="method"], select[name*="payment_method"]', 'cash')
    await page.fill('input[name="reference"], input[name*="reference"]', 'PAY-E2E-001')
    
    // Select invoice to apply payment to (if available)
    const invoiceSelect = page.locator('select[name*="invoice"], .invoice-select')
    if (await invoiceSelect.isVisible()) {
      await invoiceSelect.selectOption({ index: 1 }) // First available invoice
    }
    
    // Save payment
    await page.click('button:has-text("Save"), button[type="submit"]')
    
    // Verify success
    await expect(page.locator('text=Payment recorded, text=Success')).toBeVisible({ timeout: 5000 })
  })

  test('should view customer aging report', async ({ page }) => {
    // Navigate to AR reports
    await page.click('text=Reports, nav >> text=Reports')
    await page.click('text=Aging, text=Customer Aging')
    
    await expect(page).toHaveURL(/aging|ar-aging|customer-aging/)
    
    // Generate report
    await page.click('button:has-text("Generate"), button:has-text("Run Report")')
    
    // Verify report loads
    await expect(page.locator('table, .aging-report')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Customer, text=Current, text=30 Days')).toBeVisible()
  })

  test('should view customer statement', async ({ page }) => {
    // Navigate to customer statements
    await page.click('text=Reports, nav >> text=Reports')
    await page.click('text=Customer Statement, text=Statement')
    
    // Select customer
    await page.selectOption('select[name*="customer"], .customer-select', '1')
    
    // Set date range
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 1)
    const endDate = new Date()
    
    await page.fill('input[type="date"]:first', startDate.toISOString().split('T')[0])
    await page.fill('input[type="date"]:last', endDate.toISOString().split('T')[0])
    
    // Generate statement
    await page.click('button:has-text("Generate"), button:has-text("View Statement")')
    
    // Verify statement loads
    await expect(page.locator('table, .customer-statement')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Date, text=Description, text=Debit, text=Credit')).toBeVisible()
  })

  test('should handle customer credit limit validation', async ({ page }) => {
    // Navigate to customers
    await page.click('text=Customers, text=AR')
    
    // Edit existing customer to set credit limit
    await page.click('tr >> button:has-text("Edit"), .edit-button >> first')
    
    // Set low credit limit
    await page.fill('input[name="credit_limit"]', '100.00')
    await page.click('button:has-text("Save")')
    
    // Try to create invoice that exceeds credit limit
    await page.click('text=Invoices, nav >> text=Invoices')
    await page.click('button:has-text("New")')
    
    await page.selectOption('select[name*="customer"]', '1') // Customer with $100 limit
    await page.fill('input[name="invoice_number"]', 'INV-OVERLIMIT-001')
    await page.fill('input[type="date"]', new Date().toISOString().split('T')[0])
    
    // Add line that exceeds credit limit
    await page.click('button:has-text("Add Line")')
    await page.fill('input[name*="description"]:visible', 'High value item')
    await page.fill('input[name*="quantity"]:visible', '1')
    await page.fill('input[name*="price"]:visible', '500.00') // Exceeds $100 limit
    
    // Try to save
    await page.click('button:has-text("Save")')
    
    // Should show credit limit warning/error
    await expect(page.locator('text=credit limit, text=exceeds, .warning, .error')).toBeVisible({ timeout: 3000 })
  })

  test('should process partial payment allocation', async ({ page }) => {
    // Navigate to payments
    await page.click('text=Payments, text=AR')
    await page.click('button:has-text("New")')
    
    // Create partial payment
    await page.selectOption('select[name*="customer"]', '1')
    await page.fill('input[name="amount"]', '50.00') // Partial amount
    await page.fill('input[type="date"]', new Date().toISOString().split('T')[0])
    await page.selectOption('select[name*="method"]', 'cash')
    await page.fill('input[name="reference"]', 'PARTIAL-PAY-001')
    
    // If invoice allocation is available, select invoice
    const invoiceSelect = page.locator('select[name*="invoice"]')
    if (await invoiceSelect.isVisible()) {
      await invoiceSelect.selectOption({ index: 1 })
    }
    
    await page.click('button:has-text("Save")')
    
    // Verify partial payment recorded
    await expect(page.locator('text=Payment recorded, text=partial, text=Success')).toBeVisible({ timeout: 5000 })
    
    // Check that invoice still shows remaining balance
    await page.click('text=Invoices, nav >> text=Invoices')
    
    // Look for invoice with partial payment
    await expect(page.locator('tr:has-text("50.00"), .partial-payment')).toBeVisible({ timeout: 3000 })
  })
})
