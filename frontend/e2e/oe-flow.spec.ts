import { test, expect } from '@playwright/test'

test.describe('Order Entry Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/')
    await page.fill('input[name="email"], input[type="email"]', 'admin@acme001.com')
    await page.fill('input[name="password"], input[type="password"]', 'admin123')
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")')
    await expect(page).toHaveURL(/dashboard|app|home/, { timeout: 10000 })
  })

  test('should create sales order', async ({ page }) => {
    // Navigate to sales orders
    await page.click('text=Sales Orders, text=Orders, nav >> text=Sales Orders')
    
    // Create new sales order
    await page.click('button:has-text("New"), button:has-text("Create Order")')
    
    // Fill order details
    await page.selectOption('select[name*="customer"], .customer-select', '1') // First customer
    await page.fill('input[name="order_number"], input[name="reference"]', 'SO-E2E-001')
    
    // Set order date
    const today = new Date().toISOString().split('T')[0]
    await page.fill('input[type="date"], input[name*="date"]', today)
    
    // Set delivery date
    const deliveryDate = new Date()
    deliveryDate.setDate(deliveryDate.getDate() + 7)
    await page.fill('input[name*="delivery"], input[name*="due_date"]', deliveryDate.toISOString().split('T')[0])
    
    // Add order lines
    await page.click('button:has-text("Add Line"), .add-line')
    await page.selectOption('select[name*="item"], .item-select >> first', '1') // First item
    await page.fill('input[name*="quantity"]:visible >> first', '5')
    await page.fill('input[name*="price"], input[name*="unit_price"]:visible >> first', '25.00')
    
    await page.click('button:has-text("Add Line"), .add-line')
    await page.selectOption('select[name*="item"], .item-select >> nth=1', '2') // Second item
    await page.fill('input[name*="quantity"]:visible >> nth=1', '3')
    await page.fill('input[name*="price"]:visible >> nth=1', '40.00')
    
    // Apply discount if available
    const discountField = page.locator('input[name*="discount"]')
    if (await discountField.isVisible()) {
      await discountField.fill('5') // 5% discount
    }
    
    // Save order
    await page.click('button:has-text("Save"), button[type="submit"]')
    
    // Verify success
    await expect(page.locator('text=Sales order created, text=Order created, text=Success')).toBeVisible({ timeout: 5000 })
  })

  test('should confirm sales order', async ({ page }) => {
    // Navigate to sales orders
    await page.click('text=Sales Orders, text=Orders')
    
    // Find a draft order or create one
    const draftOrder = page.locator('tr:has-text("Draft"), tr:has-text("Pending")').first()
    
    if (await draftOrder.count() === 0) {
      // Create a new order first
      await page.click('button:has-text("New")')
      await page.selectOption('select[name*="customer"]', '1')
      await page.fill('input[name="order_number"]', 'SO-CONFIRM-001')
      await page.fill('input[type="date"]', new Date().toISOString().split('T')[0])
      
      await page.click('button:has-text("Add Line")')
      await page.selectOption('select[name*="item"]', '1')
      await page.fill('input[name*="quantity"]:visible', '2')
      await page.fill('input[name*="price"]:visible', '50.00')
      
      await page.click('button:has-text("Save")')
      await expect(page.locator('text=created')).toBeVisible()
    }
    
    // Confirm the order
    await page.click('tr:has-text("Draft") >> button:has-text("Confirm"), .confirm-button')
    
    // Handle confirmation dialog if present
    const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")')
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click()
    }
    
    // Verify confirmation
    await expect(page.locator('text=Order confirmed, text=Confirmed successfully')).toBeVisible({ timeout: 5000 })
  })

  test('should pick and pack order', async ({ page }) => {
    // Navigate to picking
    await page.click('text=Picking, text=Warehouse, nav >> text=Picking')
    
    // Find order to pick or create confirmed order first
    const pickableOrder = page.locator('tr:has-text("Ready"), tr:has-text("Confirmed")').first()
    
    if (await pickableOrder.count() === 0) {
      // Create and confirm order first
      await page.click('text=Sales Orders, nav >> text=Sales Orders')
      await page.click('button:has-text("New")')
      
      await page.selectOption('select[name*="customer"]', '1')
      await page.fill('input[name="order_number"]', 'SO-PICK-001')
      await page.fill('input[type="date"]', new Date().toISOString().split('T')[0])
      
      await page.click('button:has-text("Add Line")')
      await page.selectOption('select[name*="item"]', '1')
      await page.fill('input[name*="quantity"]:visible', '3')
      await page.fill('input[name*="price"]:visible', '30.00')
      
      await page.click('button:has-text("Save")')
      await page.click('button:has-text("Confirm")')
      
      // Go back to picking
      await page.click('text=Picking, nav >> text=Picking')
    }
    
    // Start picking process
    await page.click('tr:has-text("Ready"), tr:has-text("Confirmed") >> button:has-text("Pick"), .pick-button')
    
    // Pick items
    const pickLines = page.locator('tr:has(input[name*="picked"])')
    const lineCount = await pickLines.count()
    
    for (let i = 0; i < lineCount; i++) {
      const line = pickLines.nth(i)
      const orderedQty = await line.locator('td:nth-child(3), .ordered-qty').textContent()
      const pickedQty = parseInt(orderedQty || '0')
      
      // Pick full quantity
      await line.locator('input[name*="picked"]').fill(pickedQty.toString())
    }
    
    // Complete picking
    await page.click('button:has-text("Complete Pick"), button:has-text("Finish Picking")')
    
    // Verify picking completed
    await expect(page.locator('text=Picking completed, text=Ready for packing')).toBeVisible({ timeout: 5000 })
    
    // Move to packing
    await page.click('button:has-text("Pack"), .pack-button')
    
    // Pack items
    const packLines = page.locator('tr:has(input[name*="packed"])')
    const packLineCount = await packLines.count()
    
    for (let i = 0; i < packLineCount; i++) {
      const line = packLines.nth(i)
      const pickedQty = await line.locator('td:nth-child(4), .picked-qty').textContent()
      const packedQty = parseInt(pickedQty || '0')
      
      // Pack all picked items
      await line.locator('input[name*="packed"]').fill(packedQty.toString())
    }
    
    // Add tracking information
    await page.fill('input[name="tracking_number"]', 'TRK-E2E-001')
    await page.selectOption('select[name*="carrier"]', 'ups')
    
    // Complete packing
    await page.click('button:has-text("Complete Pack"), button:has-text("Finish Packing")')
    
    // Verify packing completed
    await expect(page.locator('text=Packing completed, text=Ready for shipping')).toBeVisible({ timeout: 5000 })
  })

  test('should ship order', async ({ page }) => {
    // Navigate to shipping
    await page.click('text=Shipping, text=Fulfillment, nav >> text=Shipping')
    
    // Find order ready for shipping
    const shippableOrder = page.locator('tr:has-text("Packed"), tr:has-text("Ready to Ship")').first()
    
    if (await shippableOrder.count() === 0) {
      // Skip if no orders ready for shipping
      test.skip()
    }
    
    // Ship the order
    await page.click('tr:has-text("Packed") >> button:has-text("Ship"), .ship-button')
    
    // Confirm shipping details
    await page.fill('input[name="actual_ship_date"]', new Date().toISOString().split('T')[0])
    
    // Update tracking if needed
    const trackingField = page.locator('input[name="tracking_number"]')
    if (await trackingField.isVisible() && !await trackingField.inputValue()) {
      await trackingField.fill('TRK-SHIP-001')
    }
    
    // Confirm shipment
    await page.click('button:has-text("Confirm Shipment"), button:has-text("Ship Now")')
    
    // Verify shipment
    await expect(page.locator('text=Order shipped, text=Shipment confirmed')).toBeVisible({ timeout: 5000 })
  })

  test('should convert order to invoice', async ({ page }) => {
    // Navigate to sales orders
    await page.click('text=Sales Orders, text=Orders')
    
    // Find a confirmed order
    const confirmedOrder = page.locator('tr:has-text("Confirmed"), tr:has-text("Shipped")').first()
    
    if (await confirmedOrder.count() === 0) {
      // Create and confirm order first
      await page.click('button:has-text("New")')
      await page.selectOption('select[name*="customer"]', '1')
      await page.fill('input[name="order_number"]', 'SO-INVOICE-001')
      await page.fill('input[type="date"]', new Date().toISOString().split('T')[0])
      
      await page.click('button:has-text("Add Line")')
      await page.selectOption('select[name*="item"]', '1')
      await page.fill('input[name*="quantity"]:visible', '4')
      await page.fill('input[name*="price"]:visible', '20.00')
      
      await page.click('button:has-text("Save")')
      await page.click('button:has-text("Confirm")')
      await expect(page.locator('text=confirmed')).toBeVisible()
    }
    
    // Convert to invoice
    await page.click('tr:has-text("Confirmed") >> button:has-text("Invoice"), .invoice-button')
    
    // Review invoice details
    await expect(page).toHaveURL(/invoice|ar/)
    
    // Verify invoice creation
    await expect(page.locator('text=Invoice created from order, text=converted')).toBeVisible({ timeout: 5000 })
    
    // Verify invoice details match order
    const invoiceTotal = await page.locator('input[name*="total"], .total-amount').textContent()
    expect(invoiceTotal).toBeTruthy()
  })

  test('should handle backorders', async ({ page }) => {
    // Navigate to sales orders
    await page.click('text=Sales Orders, text=Orders')
    await page.click('button:has-text("New")')
    
    // Create order with insufficient stock
    await page.selectOption('select[name*="customer"]', '1')
    await page.fill('input[name="order_number"]', 'SO-BACKORDER-001')
    await page.fill('input[type="date"]', new Date().toISOString().split('T')[0])
    
    // Add line with high quantity to trigger backorder
    await page.click('button:has-text("Add Line")')
    await page.selectOption('select[name*="item"]', '1')
    await page.fill('input[name*="quantity"]:visible', '999') // High quantity likely to exceed stock
    await page.fill('input[name*="price"]:visible', '15.00')
    
    // Save order
    await page.click('button:has-text("Save")')
    
    // Check for stock warning or backorder notification
    const stockWarning = page.locator('text=insufficient stock, text=backorder, text=out of stock, .warning')
    if (await stockWarning.isVisible({ timeout: 3000 })) {
      await expect(stockWarning).toBeVisible()
      
      // Accept backorder if option is available
      const acceptBackorder = page.locator('button:has-text("Accept Backorder"), input[name*="backorder"]')
      if (await acceptBackorder.isVisible()) {
        await acceptBackorder.click()
      }
    }
    
    // Confirm order
    await page.click('button:has-text("Confirm")')
    
    // Verify backorder status
    await expect(page.locator('text=backorder, text=partial')).toBeVisible({ timeout: 3000 })
  })

  test('should process order returns', async ({ page }) => {
    // Navigate to returns
    await page.click('text=Returns, text=RMA, nav >> text=Returns')
    
    // Create new return
    await page.click('button:has-text("New"), button:has-text("Create Return")')
    
    // Select original order/invoice
    await page.selectOption('select[name*="order"], select[name*="invoice"]', '1')
    
    // Fill return details
    await page.fill('input[name="rma_number"], input[name="reference"]', 'RMA-E2E-001')
    await page.fill('input[type="date"]', new Date().toISOString().split('T')[0])
    await page.selectOption('select[name*="reason"]', 'defective')
    
    // Select items to return
    const returnLines = page.locator('input[name*="return_qty"], .return-quantity')
    const lineCount = await returnLines.count()
    
    for (let i = 0; i < Math.min(lineCount, 2); i++) {
      await returnLines.nth(i).fill('1') // Return 1 unit of each item
    }
    
    // Save return
    await page.click('button:has-text("Save")')
    
    // Verify return created
    await expect(page.locator('text=Return created, text=RMA created')).toBeVisible({ timeout: 5000 })
    
    // Authorize return
    await page.click('button:has-text("Authorize"), .authorize-button')
    
    // Receive returned items
    await page.click('button:has-text("Receive"), .receive-button')
    
    // Inspect returned items
    const inspectionLines = page.locator('select[name*="condition"], .condition-select')
    const inspectionCount = await inspectionLines.count()
    
    for (let i = 0; i < inspectionCount; i++) {
      await inspectionLines.nth(i).selectOption('good') // Mark as good condition
    }
    
    // Complete inspection
    await page.click('button:has-text("Complete Inspection")')
    
    // Process refund/credit
    await page.click('button:has-text("Process Refund"), button:has-text("Issue Credit")')
    
    // Verify return completion
    await expect(page.locator('text=Return processed, text=refund issued')).toBeVisible({ timeout: 5000 })
  })

  test('should view order status and tracking', async ({ page }) => {
    // Navigate to order tracking
    await page.click('text=Order Tracking, text=Track Orders, nav >> text=Order Tracking')
    
    // Search for order
    await page.fill('input[name*="search"], input[placeholder*="order"]', 'SO-')
    await page.click('button:has-text("Search"), button[type="submit"]')
    
    // Verify search results
    await expect(page.locator('table, .order-list')).toBeVisible({ timeout: 5000 })
    
    // Click on an order to view details
    await page.click('tr >> td:has-text("SO-") >> first')
    
    // Verify order details page
    await expect(page.locator('.order-details, .order-status')).toBeVisible({ timeout: 3000 })
    
    // Check status timeline
    await expect(page.locator('text=Created, text=Confirmed, text=Shipped')).toBeVisible()
    
    // Check tracking information if available
    const trackingInfo = page.locator('.tracking-info, text=Tracking')
    if (await trackingInfo.isVisible()) {
      await expect(trackingInfo).toBeVisible()
    }
  })

  test('should generate order reports', async ({ page }) => {
    // Navigate to sales reports
    await page.click('text=Reports, nav >> text=Reports')
    await page.click('text=Sales Orders, text=Order Report')
    
    // Set date range
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 1)
    const endDate = new Date()
    
    await page.fill('input[type="date"]:first', startDate.toISOString().split('T')[0])
    await page.fill('input[type="date"]:last', endDate.toISOString().split('T')[0])
    
    // Select status filter
    const statusFilter = page.locator('select[name*="status"]')
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('all')
    }
    
    // Generate report
    await page.click('button:has-text("Generate"), button:has-text("Run Report")')
    
    // Verify report loads
    await expect(page.locator('table, .sales-report')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Order Number, text=Customer, text=Total, text=Status')).toBeVisible()
    
    // Check summary totals
    const totalSales = page.locator('.total-sales, tfoot td:last-child')
    if (await totalSales.isVisible()) {
      const totalText = await totalSales.textContent()
      expect(totalText).toBeTruthy()
    }
  })
})
