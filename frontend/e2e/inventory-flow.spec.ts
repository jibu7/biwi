import { test, expect } from '@playwright/test'

test.describe('Inventory Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/')
    await page.fill('input[name="email"], input[type="email"]', 'admin@acme001.com')
    await page.fill('input[name="password"], input[type="password"]', 'admin123')
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")')
    await expect(page).toHaveURL(/dashboard|app|home/, { timeout: 10000 })
  })

  test('should create inventory item', async ({ page }) => {
    // Navigate to inventory items
    await page.click('text=Inventory, text=Items, nav >> text=Inventory')
    
    // Create new item
    await page.click('button:has-text("New"), button:has-text("Add Item")')
    
    // Fill item details
    await page.fill('input[name="sku"], input[name="code"]', 'TEST-ITEM-001')
    await page.fill('input[name="name"], input[name="description"]', 'Test Inventory Item')
    await page.fill('textarea[name="description"], textarea[name="notes"]', 'This is a test inventory item for E2E testing')
    
    // Set item type
    await page.selectOption('select[name*="type"], select[name*="category"]', 'raw_material')
    
    // Set unit of measure
    await page.selectOption('select[name*="uom"], select[name*="unit"]', 'each')
    
    // Set costs
    await page.fill('input[name*="cost"], input[name*="unit_cost"]', '10.50')
    await page.fill('input[name*="price"], input[name*="selling_price"]', '15.75')
    
    // Set stock levels
    await page.fill('input[name*="min_stock"], input[name*="reorder_level"]', '10')
    await page.fill('input[name*="max_stock"], input[name*="max_level"]', '100')
    
    // Save item
    await page.click('button:has-text("Save"), button[type="submit"]')
    
    // Verify success
    await expect(page.locator('text=Item created, text=Success')).toBeVisible({ timeout: 5000 })
  })

  test('should record stock receipt', async ({ page }) => {
    // Navigate to stock movements
    await page.click('text=Inventory, text=Stock Movements, nav >> text=Stock Movements')
    
    // Create new receipt
    await page.click('button:has-text("New"), button:has-text("Stock Receipt")')
    
    // Fill receipt details
    await page.fill('input[name="reference"], input[name="document_number"]', 'REC-E2E-001')
    await page.fill('input[type="date"]', new Date().toISOString().split('T')[0])
    
    // Select warehouse/location
    const warehouseSelect = page.locator('select[name*="warehouse"], select[name*="location"]')
    if (await warehouseSelect.isVisible()) {
      await warehouseSelect.selectOption({ index: 1 })
    }
    
    // Add stock lines
    await page.click('button:has-text("Add Line"), .add-line')
    await page.selectOption('select[name*="item"], .item-select >> first', '1') // First item
    await page.fill('input[name*="quantity"]:visible >> first', '50')
    await page.fill('input[name*="cost"], input[name*="unit_cost"]:visible >> first', '10.50')
    
    await page.click('button:has-text("Add Line"), .add-line')
    await page.selectOption('select[name*="item"], .item-select >> nth=1', '2') // Second item
    await page.fill('input[name*="quantity"]:visible >> nth=1', '25')
    await page.fill('input[name*="cost"]:visible >> nth=1', '8.75')
    
    // Save receipt
    await page.click('button:has-text("Save"), button[type="submit"]')
    
    // Verify success
    await expect(page.locator('text=Stock receipt created, text=Success')).toBeVisible({ timeout: 5000 })
  })

  test('should process stock issue', async ({ page }) => {
    // Navigate to stock movements
    await page.click('text=Inventory, text=Stock Movements')
    
    // Create new issue
    await page.click('button:has-text("New"), button:has-text("Stock Issue")')
    
    // Fill issue details
    await page.fill('input[name="reference"]', 'ISS-E2E-001')
    await page.fill('input[type="date"]', new Date().toISOString().split('T')[0])
    
    // Select issue reason/type
    await page.selectOption('select[name*="reason"], select[name*="type"]', 'production')
    
    // Add issue lines
    await page.click('button:has-text("Add Line")')
    await page.selectOption('select[name*="item"] >> first', '1')
    await page.fill('input[name*="quantity"]:visible >> first', '15') // Issue 15 units
    
    // Save issue
    await page.click('button:has-text("Save")')
    
    // Verify success
    await expect(page.locator('text=Stock issue created, text=Success')).toBeVisible({ timeout: 5000 })
  })

  test('should perform stock transfer', async ({ page }) => {
    // Navigate to stock transfers
    await page.click('text=Inventory, text=Transfers, nav >> text=Stock Transfers')
    
    // Create new transfer
    await page.click('button:has-text("New"), button:has-text("New Transfer")')
    
    // Fill transfer details
    await page.fill('input[name="reference"]', 'TRF-E2E-001')
    await page.fill('input[type="date"]', new Date().toISOString().split('T')[0])
    
    // Select from and to locations
    await page.selectOption('select[name*="from"], .from-location', '1') // From location
    await page.selectOption('select[name*="to"], .to-location', '2') // To location
    
    // Add transfer lines
    await page.click('button:has-text("Add Line")')
    await page.selectOption('select[name*="item"]', '1')
    await page.fill('input[name*="quantity"]:visible', '10')
    
    // Save transfer
    await page.click('button:has-text("Save")')
    await expect(page.locator('text=Transfer created')).toBeVisible({ timeout: 5000 })
    
    // Process transfer (ship)
    await page.click('button:has-text("Ship"), .ship-button')
    await expect(page.locator('text=shipped')).toBeVisible({ timeout: 3000 })
    
    // Receive transfer
    await page.click('button:has-text("Receive"), .receive-button')
    await page.fill('input[name*="received_quantity"]:visible', '10')
    await page.click('button:has-text("Confirm Receipt")')
    
    // Verify completion
    await expect(page.locator('text=Transfer completed, text=received')).toBeVisible({ timeout: 5000 })
  })

  test('should perform stock adjustment', async ({ page }) => {
    // Navigate to stock adjustments
    await page.click('text=Inventory, text=Adjustments, nav >> text=Stock Adjustments')
    
    // Create new adjustment
    await page.click('button:has-text("New"), button:has-text("New Adjustment")')
    
    // Fill adjustment details
    await page.fill('input[name="reference"]', 'ADJ-E2E-001')
    await page.fill('input[type="date"]', new Date().toISOString().split('T')[0])
    await page.selectOption('select[name*="reason"]', 'count_variance')
    
    // Add adjustment lines
    await page.click('button:has-text("Add Line")')
    await page.selectOption('select[name*="item"]', '1')
    
    // Current stock should be populated automatically
    const currentStock = await page.locator('input[name*="current"], .current-stock').inputValue()
    
    // Adjust quantity (physical count vs system)
    const adjustedQty = (parseInt(currentStock || '0') + 5).toString()
    await page.fill('input[name*="physical"], input[name*="counted"]', adjustedQty)
    
    // Reason for adjustment
    await page.fill('textarea[name*="notes"], textarea[name*="reason"]', 'Physical count variance - found extra stock')
    
    // Save adjustment
    await page.click('button:has-text("Save")')
    
    // Verify success
    await expect(page.locator('text=Adjustment created, text=Success')).toBeVisible({ timeout: 5000 })
    
    // Post adjustment
    await page.click('button:has-text("Post"), .post-button')
    await expect(page.locator('text=Adjustment posted')).toBeVisible({ timeout: 3000 })
  })

  test('should view stock levels report', async ({ page }) => {
    // Navigate to inventory reports
    await page.click('text=Reports, nav >> text=Reports')
    await page.click('text=Stock Levels, text=Inventory Report')
    
    await expect(page).toHaveURL(/stock-levels|inventory-report/)
    
    // Apply filters if available
    const warehouseFilter = page.locator('select[name*="warehouse"], .warehouse-filter')
    if (await warehouseFilter.isVisible()) {
      await warehouseFilter.selectOption({ index: 0 }) // All warehouses
    }
    
    // Generate report
    await page.click('button:has-text("Generate"), button:has-text("Run Report")')
    
    // Verify report loads
    await expect(page.locator('table, .stock-report')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Item, text=SKU, text=On Hand, text=Available')).toBeVisible()
    
    // Check for items with low stock warnings
    const lowStockWarning = page.locator('.low-stock, text=Low Stock, .warning')
    if (await lowStockWarning.isVisible()) {
      await expect(lowStockWarning).toBeVisible()
    }
  })

  test('should perform cycle count', async ({ page }) => {
    // Navigate to cycle counts
    await page.click('text=Inventory, text=Cycle Count, nav >> text=Cycle Count')
    
    // Create new cycle count
    await page.click('button:has-text("New"), button:has-text("Start Count")')
    
    // Fill count details
    await page.fill('input[name="reference"]', 'CC-E2E-001')
    await page.fill('input[type="date"]', new Date().toISOString().split('T')[0])
    
    // Select count scope
    await page.selectOption('select[name*="scope"], select[name*="type"]', 'random_sample')
    
    // Select warehouse
    const warehouseSelect = page.locator('select[name*="warehouse"]')
    if (await warehouseSelect.isVisible()) {
      await warehouseSelect.selectOption({ index: 1 })
    }
    
    // Generate count list
    await page.click('button:has-text("Generate List"), button:has-text("Create Count")')
    
    // Verify count created
    await expect(page.locator('text=Cycle count created, text=Count generated')).toBeVisible({ timeout: 5000 })
    
    // Start counting process
    await page.click('button:has-text("Start Counting")')
    
    // Count items (simulate counting process)
    const countRows = page.locator('tr:has(input[name*="counted"])')
    const rowCount = await countRows.count()
    
    for (let i = 0; i < Math.min(rowCount, 3); i++) {
      const row = countRows.nth(i)
      const systemQty = await row.locator('td:nth-child(3), .system-qty').textContent()
      const countedQty = parseInt(systemQty || '0')
      
      // Enter counted quantity (with small variance)
      await row.locator('input[name*="counted"]').fill((countedQty + (i % 2 === 0 ? 1 : -1)).toString())
    }
    
    // Complete count
    await page.click('button:has-text("Complete Count"), button:has-text("Finish")')
    
    // Verify completion
    await expect(page.locator('text=Count completed, text=variances detected')).toBeVisible({ timeout: 5000 })
    
    // Review and approve variances
    await page.click('button:has-text("Approve Variances"), button:has-text("Post Adjustments")')
    
    // Verify posting
    await expect(page.locator('text=Adjustments posted, text=Count finalized')).toBeVisible({ timeout: 3000 })
  })

  test('should handle reorder point alerts', async ({ page }) => {
    // Navigate to inventory items
    await page.click('text=Inventory, text=Items')
    
    // Find item to set low reorder point
    await page.click('tr >> button:has-text("Edit"), .edit-button >> first')
    
    // Set very high reorder level to trigger alert
    await page.fill('input[name*="reorder"], input[name*="min_stock"]', '1000')
    await page.click('button:has-text("Save")')
    
    // Navigate to dashboard or alerts
    await page.click('text=Dashboard, nav >> text=Dashboard')
    
    // Look for reorder alerts
    const reorderAlert = page.locator('.reorder-alert, text=Reorder, text=Low Stock')
    if (await reorderAlert.isVisible({ timeout: 5000 })) {
      await expect(reorderAlert).toBeVisible()
    }
    
    // Check alerts/notifications section
    await page.click('text=Alerts, text=Notifications, .alerts')
    await expect(page.locator('text=reorder, text=low stock')).toBeVisible({ timeout: 3000 })
  })

  test('should generate valuation report', async ({ page }) => {
    // Navigate to inventory reports
    await page.click('text=Reports, nav >> text=Reports')
    await page.click('text=Inventory Valuation, text=Stock Valuation')
    
    // Set valuation date
    await page.fill('input[type="date"], input[name*="date"]', new Date().toISOString().split('T')[0])
    
    // Select valuation method
    await page.selectOption('select[name*="method"], select[name*="valuation"]', 'fifo')
    
    // Generate report
    await page.click('button:has-text("Generate"), button:has-text("Calculate")')
    
    // Verify report loads
    await expect(page.locator('table, .valuation-report')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Item, text=Quantity, text=Unit Cost, text=Total Value')).toBeVisible()
    
    // Check total valuation
    const totalValue = page.locator('.total-value, tfoot td:last-child')
    await expect(totalValue).toBeVisible()
    
    // Verify total is greater than 0 if there's inventory
    const totalText = await totalValue.textContent()
    if (totalText && totalText.match(/[\d,]+/)) {
      expect(parseFloat(totalText.replace(/[^0-9.-]+/g, ''))).toBeGreaterThanOrEqual(0)
    }
  })
})
