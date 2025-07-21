import { test, expect } from '@playwright/test'

test.describe('Accounts Payable Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/')
    await page.fill('input[name="email"], input[type="email"]', 'admin@acme001.com')
    await page.fill('input[name="password"], input[type="password"]', 'admin123')
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")')
    await expect(page).toHaveURL(/dashboard|app|home/, { timeout: 10000 })
  })

  test('should create a supplier', async ({ page }) => {
    // Navigate to suppliers
    await page.click('text=Suppliers, text=AP, nav >> text=Suppliers')
    
    // Create new supplier
    await page.click('button:has-text("New"), button:has-text("Add Supplier")')
    
    // Fill supplier details
    await page.fill('input[name="name"], input[name="supplier_name"]', 'Test Supplier Inc')
    await page.fill('input[name="email"]', 'test.supplier@example.com')
    await page.fill('input[name="phone"]', '+1-555-987-6543')
    await page.fill('textarea[name="address"], input[name="address"]', '456 Supplier Ave, Vendor City, VC 67890')
    await page.fill('input[name="tax_id"], input[name="tax_number"]', 'TAX123456789')
    
    // Save supplier
    await page.click('button:has-text("Save"), button[type="submit"]')
    
    // Verify success
    await expect(page.locator('text=Supplier created, text=Success')).toBeVisible({ timeout: 5000 })
  })

  test('should create supplier invoice', async ({ page }) => {
    // Navigate to supplier invoices
    await page.click('text=Bills, text=AP, nav >> text=Bills')
    
    // Create new bill/invoice
    await page.click('button:has-text("New"), button:has-text("Create Bill")')
    
    // Select supplier
    await page.selectOption('select[name*="supplier"], .supplier-select', '1') // First supplier
    
    // Fill invoice details
    await page.fill('input[name="invoice_number"], input[name="reference"]', 'BILL-E2E-001')
    await page.fill('input[name="supplier_invoice_number"]', 'SUP-INV-001')
    
    // Set invoice date
    const today = new Date().toISOString().split('T')[0]
    await page.fill('input[type="date"], input[name*="date"]', today)
    
    // Set due date (30 days from today)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30)
    await page.fill('input[name*="due_date"]', dueDate.toISOString().split('T')[0])
    
    // Add invoice lines
    await page.click('button:has-text("Add Line"), .add-line')
    await page.fill('input[name*="description"]:visible >> first', 'Office Supplies')
    await page.fill('input[name*="quantity"]:visible >> first', '5')
    await page.fill('input[name*="price"], input[name*="unit_cost"]:visible >> first', '25.00')
    
    await page.click('button:has-text("Add Line"), .add-line')
    await page.fill('input[name*="description"]:visible >> nth=1', 'Consulting Services')
    await page.fill('input[name*="quantity"]:visible >> nth=1', '10')
    await page.fill('input[name*="price"], input[name*="unit_cost"]:visible >> nth=1', '80.00')
    
    // Save invoice
    await page.click('button:has-text("Save"), button[type="submit"]')
    
    // Verify success
    await expect(page.locator('text=Bill created, text=Invoice created, text=Success')).toBeVisible({ timeout: 5000 })
  })

  test('should approve supplier invoice', async ({ page }) => {
    // Navigate to bills
    await page.click('text=Bills, text=AP')
    
    // Find a draft bill or create one
    const draftBill = page.locator('tr:has-text("Draft"), tr:has-text("Pending")').first()
    
    if (await draftBill.count() === 0) {
      // Create a new bill first
      await page.click('button:has-text("New")')
      await page.selectOption('select[name*="supplier"]', '1')
      await page.fill('input[name="invoice_number"]', 'BILL-APPROVE-001')
      await page.fill('input[name="supplier_invoice_number"]', 'SUP-APPROVE-001')
      await page.fill('input[type="date"]', new Date().toISOString().split('T')[0])
      
      await page.click('button:has-text("Add Line")')
      await page.fill('input[name*="description"]:visible >> first', 'Test Expense')
      await page.fill('input[name*="quantity"]:visible >> first', '1')
      await page.fill('input[name*="price"]:visible >> first', '300.00')
      
      await page.click('button:has-text("Save")')
      await expect(page.locator('text=created')).toBeVisible()
    }
    
    // Approve the bill
    await page.click('tr:has-text("Draft"), tr:has-text("Pending") >> button:has-text("Approve"), .approve-button')
    
    // Confirm approval if needed
    const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")')
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click()
    }
    
    // Verify approval success
    await expect(page.locator('text=Bill approved, text=Approved successfully')).toBeVisible({ timeout: 5000 })
  })

  test('should record supplier payment', async ({ page }) => {
    // Navigate to payments
    await page.click('text=Payments, text=AP, nav >> text=Payments')
    
    // Create new payment
    await page.click('button:has-text("New"), button:has-text("Make Payment")')
    
    // Select supplier
    await page.selectOption('select[name*="supplier"], .supplier-select', '1')
    
    // Fill payment details
    await page.fill('input[name="amount"]', '300.00')
    await page.fill('input[type="date"], input[name*="date"]', new Date().toISOString().split('T')[0])
    await page.selectOption('select[name*="method"], select[name*="payment_method"]', 'check')
    await page.fill('input[name="reference"], input[name*="reference"]', 'CHK-E2E-001')
    await page.fill('input[name="check_number"]', '1001')
    
    // Select bill to pay (if available)
    const billSelect = page.locator('select[name*="bill"], select[name*="invoice"], .bill-select')
    if (await billSelect.isVisible()) {
      await billSelect.selectOption({ index: 1 }) // First available bill
    }
    
    // Save payment
    await page.click('button:has-text("Save"), button[type="submit"]')
    
    // Verify success
    await expect(page.locator('text=Payment recorded, text=Success')).toBeVisible({ timeout: 5000 })
  })

  test('should process purchase order workflow', async ({ page }) => {
    // Navigate to purchase orders
    await page.click('text=Purchase Orders, text=PO, nav >> text=Purchase Orders')
    
    // Create new PO
    await page.click('button:has-text("New"), button:has-text("Create PO")')
    
    // Select supplier
    await page.selectOption('select[name*="supplier"]', '1')
    
    // Fill PO details
    await page.fill('input[name="po_number"], input[name="reference"]', 'PO-E2E-001')
    await page.fill('input[type="date"]', new Date().toISOString().split('T')[0])
    
    // Add PO lines
    await page.click('button:has-text("Add Line")')
    await page.fill('input[name*="description"]:visible >> first', 'Raw Materials')
    await page.fill('input[name*="quantity"]:visible >> first', '100')
    await page.fill('input[name*="price"]:visible >> first', '5.50')
    
    // Save PO
    await page.click('button:has-text("Save")')
    await expect(page.locator('text=Purchase order created')).toBeVisible({ timeout: 5000 })
    
    // Send PO for approval
    await page.click('button:has-text("Send for Approval"), .send-approval')
    
    // Approve PO (if approval workflow exists)
    const approveButton = page.locator('button:has-text("Approve")')
    if (await approveButton.isVisible({ timeout: 3000 })) {
      await approveButton.click()
      await expect(page.locator('text=approved')).toBeVisible()
    }
    
    // Convert PO to bill (receiving process)
    await page.click('button:has-text("Receive"), button:has-text("Create Bill")')
    
    // Verify bill creation
    await expect(page.locator('text=Bill created from PO, text=converted')).toBeVisible({ timeout: 5000 })
  })

  test('should view supplier aging report', async ({ page }) => {
    // Navigate to AP reports
    await page.click('text=Reports, nav >> text=Reports')
    await page.click('text=Supplier Aging, text=AP Aging')
    
    await expect(page).toHaveURL(/aging|ap-aging|supplier-aging/)
    
    // Generate report
    await page.click('button:has-text("Generate"), button:has-text("Run Report")')
    
    // Verify report loads
    await expect(page.locator('table, .aging-report')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Supplier, text=Current, text=30 Days')).toBeVisible()
  })

  test('should handle three-way matching', async ({ page }) => {
    // Create PO first
    await page.click('text=Purchase Orders, nav >> text=Purchase Orders')
    await page.click('button:has-text("New")')
    
    await page.selectOption('select[name*="supplier"]', '1')
    await page.fill('input[name="po_number"]', 'PO-3WAY-001')
    await page.fill('input[type="date"]', new Date().toISOString().split('T')[0])
    
    await page.click('button:has-text("Add Line")')
    await page.fill('input[name*="description"]:visible', 'Test Item for 3-way match')
    await page.fill('input[name*="quantity"]:visible', '10')
    await page.fill('input[name*="price"]:visible', '15.00')
    
    await page.click('button:has-text("Save")')
    await expect(page.locator('text=created')).toBeVisible()
    
    // Record receipt
    await page.click('button:has-text("Receive"), .receive-button')
    
    // Receive partial quantity
    await page.fill('input[name*="received_quantity"]:visible', '8') // Receive less than ordered
    await page.click('button:has-text("Save Receipt")')
    
    // Create matching invoice
    await page.click('text=Bills, nav >> text=Bills')
    await page.click('button:has-text("New")')
    
    await page.selectOption('select[name*="supplier"]', '1')
    await page.fill('input[name="invoice_number"]', 'BILL-3WAY-001')
    await page.fill('input[name="supplier_invoice_number"]', 'SUP-3WAY-001')
    await page.fill('input[type="date"]', new Date().toISOString().split('T')[0])
    
    // Link to PO
    const poSelect = page.locator('select[name*="purchase_order"], .po-select')
    if (await poSelect.isVisible()) {
      await poSelect.selectOption('1')
    }
    
    // Verify 3-way matching validation
    await page.click('button:has-text("Save")')
    
    // Should show matching status or validation
    await expect(page.locator('text=3-way match, text=matching, text=validated')).toBeVisible({ timeout: 5000 })
  })

  test('should process expense claims', async ({ page }) => {
    // Navigate to expense claims
    await page.click('text=Expenses, text=Claims, nav >> text=Expense Claims')
    
    // Create new expense claim
    await page.click('button:has-text("New"), button:has-text("New Claim")')
    
    // Fill claim details
    await page.fill('input[name="description"], input[name="title"]', 'Business Travel Expenses')
    await page.fill('input[type="date"]', new Date().toISOString().split('T')[0])
    
    // Add expense lines
    await page.click('button:has-text("Add Expense"), button:has-text("Add Line")')
    await page.fill('input[name*="description"]:visible >> first', 'Hotel Accommodation')
    await page.fill('input[name*="amount"]:visible >> first', '200.00')
    await page.selectOption('select[name*="category"], select[name*="expense_type"]', 'travel')
    
    await page.click('button:has-text("Add Expense"), button:has-text("Add Line")')
    await page.fill('input[name*="description"]:visible >> nth=1', 'Meal Expenses')
    await page.fill('input[name*="amount"]:visible >> nth=1', '75.00')
    await page.selectOption('select[name*="category"] >> nth=1', 'meals')
    
    // Save claim
    await page.click('button:has-text("Save")')
    await expect(page.locator('text=Expense claim created')).toBeVisible({ timeout: 5000 })
    
    // Submit for approval
    await page.click('button:has-text("Submit"), .submit-approval')
    await expect(page.locator('text=submitted for approval')).toBeVisible({ timeout: 3000 })
  })

  test('should handle supplier payment terms', async ({ page }) => {
    // Navigate to suppliers
    await page.click('text=Suppliers, text=AP')
    
    // Edit supplier to set payment terms
    await page.click('tr >> button:has-text("Edit"), .edit-button >> first')
    
    // Set payment terms
    await page.selectOption('select[name*="payment_terms"]', 'net30') // 30 days
    await page.click('button:has-text("Save")')
    
    // Create bill for this supplier
    await page.click('text=Bills, nav >> text=Bills')
    await page.click('button:has-text("New")')
    
    await page.selectOption('select[name*="supplier"]', '1')
    await page.fill('input[name="invoice_number"]', 'BILL-TERMS-001')
    
    // Invoice date
    const today = new Date()
    await page.fill('input[type="date"]', today.toISOString().split('T')[0])
    
    // Due date should auto-calculate based on payment terms
    const dueDateField = page.locator('input[name*="due_date"]')
    await page.click('input[name*="description"], input[name="invoice_number"]') // Trigger calculation
    
    // Verify due date is 30 days from invoice date
    const expectedDueDate = new Date(today)
    expectedDueDate.setDate(expectedDueDate.getDate() + 30)
    
    const dueDateValue = await dueDateField.inputValue()
    if (dueDateValue) {
      const actualDueDate = new Date(dueDateValue)
      expect(Math.abs(actualDueDate.getTime() - expectedDueDate.getTime())).toBeLessThan(24 * 60 * 60 * 1000) // Within 1 day
    }
  })
})
