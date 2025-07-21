import { test, expect } from '@playwright/test'

test.describe('Point of Sale Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/')
    await page.fill('input[name="email"], input[type="email"]', 'admin@acme001.com')
    await page.fill('input[name="password"], input[type="password"]', 'admin123')
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")')
    await expect(page).toHaveURL(/dashboard|app|home/, { timeout: 10000 })
  })

  test('should open POS terminal', async ({ page }) => {
    // Navigate to POS
    await page.click('text=POS, text=Point of Sale, nav >> text=POS')
    
    // Verify POS interface loads
    await expect(page).toHaveURL(/pos|point-of-sale/)
    await expect(page.locator('.pos-interface, .pos-terminal')).toBeVisible({ timeout: 10000 })
    
    // Check for essential POS elements
    await expect(page.locator('.product-grid, .item-list')).toBeVisible()
    await expect(page.locator('.cart, .sale-items')).toBeVisible()
    await expect(page.locator('.total, .sale-total')).toBeVisible()
  })

  test('should add items to sale', async ({ page }) => {
    // Navigate to POS
    await page.click('text=POS, nav >> text=POS')
    
    // Add items by clicking product buttons
    await page.click('.product-item, .item-button >> first')
    await page.click('.product-item, .item-button >> nth=1')
    
    // Verify items appear in cart
    await expect(page.locator('.cart-item, .sale-line')).toHaveCount(2)
    
    // Check total is calculated
    const total = page.locator('.total-amount, .sale-total')
    const totalText = await total.textContent()
    expect(totalText).toBeTruthy()
    expect(parseFloat(totalText?.replace(/[^0-9.-]+/g, '') || '0')).toBeGreaterThan(0)
  })

  test('should modify quantities in sale', async ({ page }) => {
    // Navigate to POS
    await page.click('text=POS, nav >> text=POS')
    
    // Add an item
    await page.click('.product-item, .item-button >> first')
    
    // Increase quantity
    await page.click('.quantity-plus, .qty-increase >> first')
    await page.click('.quantity-plus, .qty-increase >> first')
    
    // Verify quantity changed
    const qtyField = page.locator('input[name*="quantity"], .quantity-input >> first')
    const qty = await qtyField.inputValue()
    expect(parseInt(qty)).toBe(3)
    
    // Decrease quantity
    await page.click('.quantity-minus, .qty-decrease >> first')
    
    // Verify quantity decreased
    const newQty = await qtyField.inputValue()
    expect(parseInt(newQty)).toBe(2)
  })

  test('should apply discounts', async ({ page }) => {
    // Navigate to POS
    await page.click('text=POS, nav >> text=POS')
    
    // Add items to cart
    await page.click('.product-item >> first')
    await page.click('.product-item >> nth=1')
    
    // Get original total
    const originalTotal = await page.locator('.total-amount, .sale-total').textContent()
    const originalAmount = parseFloat(originalTotal?.replace(/[^0-9.-]+/g, '') || '0')
    
    // Apply discount
    await page.click('button:has-text("Discount"), .discount-button')
    
    // Apply percentage discount
    await page.fill('input[name*="discount"]', '10') // 10% discount
    await page.selectOption('select[name*="type"]', 'percentage')
    await page.click('button:has-text("Apply"), button:has-text("OK")')
    
    // Verify discount applied
    const newTotal = await page.locator('.total-amount, .sale-total').textContent()
    const newAmount = parseFloat(newTotal?.replace(/[^0-9.-]+/g, '') || '0')
    
    expect(newAmount).toBeLessThan(originalAmount)
    expect(newAmount).toBeCloseTo(originalAmount * 0.9, 2) // 10% discount
  })

  test('should process cash payment', async ({ page }) => {
    // Navigate to POS
    await page.click('text=POS, nav >> text=POS')
    
    // Add items to cart
    await page.click('.product-item >> first')
    await page.click('.product-item >> nth=1')
    
    // Get sale total
    const totalText = await page.locator('.total-amount, .sale-total').textContent()
    const saleTotal = parseFloat(totalText?.replace(/[^0-9.-]+/g, '') || '0')
    
    // Process payment
    await page.click('button:has-text("Pay"), button:has-text("Checkout")')
    
    // Select cash payment
    await page.click('button:has-text("Cash"), .payment-cash')
    
    // Enter cash amount (more than total)
    const cashAmount = Math.ceil(saleTotal + 10)
    await page.fill('input[name*="amount"], .cash-amount', cashAmount.toString())
    
    // Complete payment
    await page.click('button:has-text("Complete"), button:has-text("Pay")')
    
    // Verify change calculation
    const change = page.locator('.change-amount, text*="Change"')
    await expect(change).toBeVisible({ timeout: 5000 })
    
    const changeText = await change.textContent()
    const changeAmount = parseFloat(changeText?.replace(/[^0-9.-]+/g, '') || '0')
    expect(changeAmount).toBeCloseTo(cashAmount - saleTotal, 2)
    
    // Verify sale completion
    await expect(page.locator('text=Sale completed, text=Transaction complete')).toBeVisible({ timeout: 3000 })
  })

  test('should process card payment', async ({ page }) => {
    // Navigate to POS
    await page.click('text=POS, nav >> text=POS')
    
    // Add items to cart
    await page.click('.product-item >> first')
    
    // Process payment
    await page.click('button:has-text("Pay"), button:has-text("Checkout")')
    
    // Select card payment
    await page.click('button:has-text("Card"), .payment-card')
    
    // Enter card details (for testing)
    await page.fill('input[name*="card"], input[placeholder*="card"]', '4111111111111111')
    await page.fill('input[name*="expiry"]', '12/25')
    await page.fill('input[name*="cvv"]', '123')
    
    // Process card payment
    await page.click('button:has-text("Process"), button:has-text("Charge")')
    
    // Verify payment processing
    await expect(page.locator('text=Processing, text=Authorizing')).toBeVisible({ timeout: 3000 })
    
    // Verify completion (may be mocked in test environment)
    await expect(page.locator('text=Payment approved, text=Sale completed')).toBeVisible({ timeout: 10000 })
  })

  test('should handle mixed payments', async ({ page }) => {
    // Navigate to POS
    await page.click('text=POS, nav >> text=POS')
    
    // Add items for larger sale
    await page.click('.product-item >> first')
    await page.click('.product-item >> nth=1')
    await page.click('.product-item >> nth=2')
    
    // Get total
    const totalText = await page.locator('.total-amount').textContent()
    const saleTotal = parseFloat(totalText?.replace(/[^0-9.-]+/g, '') || '0')
    
    // Start payment
    await page.click('button:has-text("Pay")')
    
    // First payment - Cash (partial)
    await page.click('button:has-text("Cash")')
    const cashAmount = Math.floor(saleTotal / 2)
    await page.fill('input[name*="amount"]', cashAmount.toString())
    await page.click('button:has-text("Add Payment"), button:has-text("Apply")')
    
    // Second payment - Card (remaining)
    await page.click('button:has-text("Card")')
    
    // Remaining amount should be auto-calculated
    const remainingAmount = page.locator('.remaining-amount, .balance-due')
    await expect(remainingAmount).toBeVisible()
    
    // Process card for remaining amount
    await page.fill('input[name*="card"]', '4111111111111111')
    await page.click('button:has-text("Process")')
    
    // Complete mixed payment
    await page.click('button:has-text("Complete Sale")')
    
    // Verify completion
    await expect(page.locator('text=Sale completed')).toBeVisible({ timeout: 5000 })
  })

  test('should void sale items', async ({ page }) => {
    // Navigate to POS
    await page.click('text=POS, nav >> text=POS')
    
    // Add items to cart
    await page.click('.product-item >> first')
    await page.click('.product-item >> nth=1')
    await page.click('.product-item >> nth=2')
    
    // Verify 3 items in cart
    await expect(page.locator('.cart-item, .sale-line')).toHaveCount(3)
    
    // Void one item
    await page.click('.cart-item >> first >> button:has-text("Remove"), .void-button >> first')
    
    // Confirm void if asked
    const confirmVoid = page.locator('button:has-text("Confirm"), button:has-text("Yes")')
    if (await confirmVoid.isVisible({ timeout: 2000 })) {
      await confirmVoid.click()
    }
    
    // Verify item removed
    await expect(page.locator('.cart-item, .sale-line')).toHaveCount(2)
    
    // Verify total recalculated
    const total = page.locator('.total-amount')
    await expect(total).toBeVisible()
  })

  test('should hold and recall sale', async ({ page }) => {
    // Navigate to POS
    await page.click('text=POS, nav >> text=POS')
    
    // Add items to cart
    await page.click('.product-item >> first')
    await page.click('.product-item >> nth=1')
    
    // Hold the sale
    await page.click('button:has-text("Hold"), .hold-sale')
    
    // Enter hold reference
    await page.fill('input[name*="reference"], input[placeholder*="reference"]', 'HOLD-E2E-001')
    await page.click('button:has-text("Hold Sale"), button:has-text("Save")')
    
    // Verify sale held and cart cleared
    await expect(page.locator('text=Sale held')).toBeVisible({ timeout: 3000 })
    await expect(page.locator('.cart-item')).toHaveCount(0)
    
    // Recall the held sale
    await page.click('button:has-text("Recall"), .recall-sale')
    
    // Select held sale
    await page.click('tr:has-text("HOLD-E2E-001") >> button:has-text("Recall")')
    
    // Verify sale recalled
    await expect(page.locator('.cart-item')).toHaveCount(2)
    
    // Complete the recalled sale
    await page.click('button:has-text("Pay")')
    await page.click('button:has-text("Cash")')
    
    const total = await page.locator('.total-amount').textContent()
    const amount = Math.ceil(parseFloat(total?.replace(/[^0-9.-]+/g, '') || '0') + 5)
    
    await page.fill('input[name*="amount"]', amount.toString())
    await page.click('button:has-text("Complete")')
    
    // Verify completion
    await expect(page.locator('text=Sale completed')).toBeVisible({ timeout: 3000 })
  })

  test('should process refund', async ({ page }) => {
    // Navigate to POS refunds
    await page.click('text=POS, nav >> text=POS')
    await page.click('button:has-text("Refund"), .refund-mode')
    
    // Search for original transaction
    await page.fill('input[name*="receipt"], input[placeholder*="receipt"]', '1')
    await page.click('button:has-text("Search"), button:has-text("Find")')
    
    // Select transaction if found
    const transaction = page.locator('tr >> button:has-text("Select")')
    if (await transaction.isVisible({ timeout: 3000 })) {
      await transaction.click()
      
      // Select items to refund
      const refundItems = page.locator('input[name*="refund"], .refund-checkbox')
      const itemCount = await refundItems.count()
      
      for (let i = 0; i < Math.min(itemCount, 2); i++) {
        await refundItems.nth(i).check()
      }
      
      // Process refund
      await page.click('button:has-text("Process Refund")')
      
      // Select refund method
      await page.click('button:has-text("Cash Refund"), button:has-text("Original Payment")')
      
      // Complete refund
      await page.click('button:has-text("Complete Refund")')
      
      // Verify refund processed
      await expect(page.locator('text=Refund processed, text=Refund completed')).toBeVisible({ timeout: 5000 })
    } else {
      // No transaction found - create a manual refund
      await page.click('button:has-text("Manual Refund")')
      
      // Add refund items manually
      await page.click('.product-item >> first')
      
      // Process manual refund
      await page.click('button:has-text("Process Refund")')
      await page.click('button:has-text("Cash Refund")')
      await page.click('button:has-text("Complete")')
      
      await expect(page.locator('text=Refund completed')).toBeVisible({ timeout: 3000 })
    }
  })

  test('should print receipt', async ({ page }) => {
    // Navigate to POS
    await page.click('text=POS, nav >> text=POS')
    
    // Add items and complete sale
    await page.click('.product-item >> first')
    await page.click('button:has-text("Pay")')
    await page.click('button:has-text("Cash")')
    
    const total = await page.locator('.total-amount').textContent()
    const amount = Math.ceil(parseFloat(total?.replace(/[^0-9.-]+/g, '') || '0') + 2)
    
    await page.fill('input[name*="amount"]', amount.toString())
    await page.click('button:has-text("Complete")')
    
    // Print receipt
    await page.click('button:has-text("Print Receipt"), .print-receipt')
    
    // Verify print dialog or receipt preview
    const receiptDialog = page.locator('.receipt-preview, .print-dialog')
    if (await receiptDialog.isVisible({ timeout: 3000 })) {
      await expect(receiptDialog).toBeVisible()
      
      // Verify receipt content
      await expect(page.locator('text*="Receipt", text*="Total", text*="Thank you"')).toBeVisible()
      
      // Close receipt dialog
      await page.click('button:has-text("Close"), .close-dialog')
    }
    
    // Start new sale
    await page.click('button:has-text("New Sale"), .new-sale')
    
    // Verify cart is empty for new sale
    await expect(page.locator('.cart-item')).toHaveCount(0)
  })

  test('should generate end of day report', async ({ page }) => {
    // Navigate to POS reports
    await page.click('text=POS, nav >> text=POS')
    await page.click('button:has-text("Reports"), .pos-reports')
    
    // Generate end of day report
    await page.click('button:has-text("End of Day"), .eod-report')
    
    // Set report date
    await page.fill('input[type="date"]', new Date().toISOString().split('T')[0])
    
    // Generate report
    await page.click('button:has-text("Generate"), button:has-text("Run Report")')
    
    // Verify report loads
    await expect(page.locator('table, .eod-report')).toBeVisible({ timeout: 10000 })
    
    // Check report sections
    await expect(page.locator('text=Sales Summary, text=Payment Methods, text=Total Sales')).toBeVisible()
    
    // Verify totals
    const totalSales = page.locator('.total-sales, text*="Total"')
    await expect(totalSales).toBeVisible()
    
    // Print report if option available
    const printButton = page.locator('button:has-text("Print"), .print-report')
    if (await printButton.isVisible()) {
      await printButton.click()
    }
  })
})
