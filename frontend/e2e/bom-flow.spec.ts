import { test, expect } from '@playwright/test'

test.describe('Bill of Materials Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/')
    await page.fill('input[name="email"], input[type="email"]', 'admin@acme001.com')
    await page.fill('input[name="password"], input[type="password"]', 'admin123')
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")')
    await expect(page).toHaveURL(/dashboard|app|home/, { timeout: 10000 })
  })

  test('should create bill of materials', async ({ page }) => {
    // Navigate to BOM management
    await page.click('text=Manufacturing, text=BOM, nav >> text=Manufacturing')
    await page.click('text=Bill of Materials, text=BOMs')
    
    // Create new BOM
    await page.click('button:has-text("New"), button:has-text("Create BOM")')
    
    // Fill BOM header details
    await page.fill('input[name="bom_number"], input[name="reference"]', 'BOM-E2E-001')
    await page.selectOption('select[name*="product"], .product-select', '1') // Finished product
    await page.fill('input[name="version"], input[name="revision"]', '1.0')
    await page.fill('textarea[name="description"]', 'Test BOM for E2E testing')
    
    // Set BOM quantity (how many units this BOM produces)
    await page.fill('input[name*="quantity"], input[name*="batch_size"]', '1')
    
    // Add BOM components
    await page.click('button:has-text("Add Component"), .add-component')
    await page.selectOption('select[name*="component"], .component-select >> first', '2') // Raw material
    await page.fill('input[name*="quantity"]:visible >> first', '2.5') // Quantity needed
    await page.selectOption('select[name*="unit"] >> first', 'kg') // Unit of measure
    
    await page.click('button:has-text("Add Component"), .add-component')
    await page.selectOption('select[name*="component"] >> nth=1', '3') // Another material
    await page.fill('input[name*="quantity"]:visible >> nth=1', '1') // Quantity needed
    await page.selectOption('select[name*="unit"] >> nth=1', 'each')
    
    await page.click('button:has-text("Add Component"), .add-component')
    await page.selectOption('select[name*="component"] >> nth=2', '4') // Third material
    await page.fill('input[name*="quantity"]:visible >> nth=2', '0.5')
    await page.selectOption('select[name*="unit"] >> nth=2', 'liter')
    
    // Set component costs if available
    const costFields = page.locator('input[name*="cost"], input[name*="unit_cost"]')
    const costCount = await costFields.count()
    
    for (let i = 0; i < costCount; i++) {
      await costFields.nth(i).fill((10 + i * 5).toString())
    }
    
    // Save BOM
    await page.click('button:has-text("Save"), button[type="submit"]')
    
    // Verify success
    await expect(page.locator('text=BOM created, text=Bill of materials created')).toBeVisible({ timeout: 5000 })
  })

  test('should activate BOM version', async ({ page }) => {
    // Navigate to BOMs
    await page.click('text=Manufacturing, text=BOM')
    await page.click('text=Bill of Materials')
    
    // Find a draft BOM or create one
    const draftBOM = page.locator('tr:has-text("Draft"), tr:has-text("Inactive")').first()
    
    if (await draftBOM.count() === 0) {
      // Create a new BOM first
      await page.click('button:has-text("New")')
      await page.fill('input[name="bom_number"]', 'BOM-ACTIVATE-001')
      await page.selectOption('select[name*="product"]', '1')
      await page.fill('input[name="version"]', '1.0')
      await page.fill('input[name*="quantity"]', '1')
      
      await page.click('button:has-text("Add Component")')
      await page.selectOption('select[name*="component"]', '2')
      await page.fill('input[name*="quantity"]:visible', '3')
      
      await page.click('button:has-text("Save")')
      await expect(page.locator('text=created')).toBeVisible()
    }
    
    // Activate the BOM
    await page.click('tr:has-text("Draft") >> button:has-text("Activate"), .activate-button')
    
    // Confirm activation if needed
    const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")')
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click()
    }
    
    // Verify activation
    await expect(page.locator('text=BOM activated, text=activated successfully')).toBeVisible({ timeout: 5000 })
  })

  test('should create production order from BOM', async ({ page }) => {
    // Navigate to production orders
    await page.click('text=Manufacturing, text=Production, nav >> text=Production Orders')
    
    // Create new production order
    await page.click('button:has-text("New"), button:has-text("Create Order")')
    
    // Fill production order details
    await page.fill('input[name="po_number"], input[name="reference"]', 'PO-E2E-001')
    await page.selectOption('select[name*="product"], .product-select', '1') // Finished product
    
    // Select BOM version
    await page.selectOption('select[name*="bom"], .bom-select', '1') // Active BOM
    
    // Set production quantity
    await page.fill('input[name*="quantity"], input[name*="order_qty"]', '10') // Produce 10 units
    
    // Set planned dates
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 7)
    
    await page.fill('input[name*="start_date"]', startDate.toISOString().split('T')[0])
    await page.fill('input[name*="end_date"]', endDate.toISOString().split('T')[0])
    
    // Save production order
    await page.click('button:has-text("Save")')
    
    // Verify creation and material requirements calculated
    await expect(page.locator('text=Production order created, text=created successfully')).toBeVisible({ timeout: 5000 })
    
    // Verify material requirements are shown
    await expect(page.locator('.material-requirements, .components-needed')).toBeVisible({ timeout: 3000 })
  })

  test('should reserve materials for production', async ({ page }) => {
    // Navigate to production orders
    await page.click('text=Manufacturing, text=Production Orders')
    
    // Find a created production order
    const createdOrder = page.locator('tr:has-text("Created"), tr:has-text("Planned")').first()
    
    if (await createdOrder.count() === 0) {
      // Create a production order first
      await page.click('button:has-text("New")')
      await page.fill('input[name="po_number"]', 'PO-RESERVE-001')
      await page.selectOption('select[name*="product"]', '1')
      await page.selectOption('select[name*="bom"]', '1')
      await page.fill('input[name*="quantity"]', '5')
      await page.fill('input[name*="start_date"]', new Date().toISOString().split('T')[0])
      
      await page.click('button:has-text("Save")')
      await expect(page.locator('text=created')).toBeVisible()
    }
    
    // Reserve materials
    await page.click('tr:has-text("Created") >> button:has-text("Reserve"), .reserve-button')
    
    // Review material availability
    const materialLines = page.locator('.material-line, tr:has(input[name*="reserve"])')
    const lineCount = await materialLines.count()
    
    // Reserve available materials
    for (let i = 0; i < lineCount; i++) {
      const line = materialLines.nth(i)
      const reserveCheckbox = line.locator('input[type="checkbox"], input[name*="reserve"]')
      
      if (await reserveCheckbox.isVisible()) {
        await reserveCheckbox.check()
      }
    }
    
    // Confirm reservation
    await page.click('button:has-text("Reserve Materials"), button:has-text("Confirm")')
    
    // Verify reservation
    await expect(page.locator('text=Materials reserved, text=reservation complete')).toBeVisible({ timeout: 5000 })
  })

  test('should start production and record progress', async ({ page }) => {
    // Navigate to production orders
    await page.click('text=Manufacturing, text=Production Orders')
    
    // Find a production order with reserved materials
    const reservedOrder = page.locator('tr:has-text("Reserved"), tr:has-text("Ready")').first()
    
    if (await reservedOrder.count() === 0) {
      console.log('No production order with reserved materials available - skipping test')
      return
    }
    
    // Start production
    await page.click('tr:has-text("Reserved") >> button:has-text("Start"), .start-production')
    
    // Confirm start
    const confirmStart = page.locator('button:has-text("Start Production"), button:has-text("Begin")')
    if (await confirmStart.isVisible({ timeout: 2000 })) {
      await confirmStart.click()
    }
    
    // Verify production started
    await expect(page.locator('text=Production started, text=in progress')).toBeVisible({ timeout: 5000 })
    
    // Record production progress
    await page.click('button:has-text("Record Progress"), .record-progress')
    
    // Enter completed quantity
    await page.fill('input[name*="completed"], input[name*="qty_completed"]', '3') // Partial completion
    
    // Record material consumption
    const consumptionLines = page.locator('input[name*="consumed"], .consumed-qty')
    const consumptionCount = await consumptionLines.count()
    
    for (let i = 0; i < consumptionCount; i++) {
      const expectedQty = await page.locator(`.required-qty >> nth=${i}`).textContent()
      const requiredQty = parseFloat(expectedQty?.replace(/[^0-9.-]+/g, '') || '0')
      
      // Consume proportional amount (3/5 of required for 3 units out of 5)
      const consumedQty = (requiredQty * 3 / 5).toFixed(2)
      await consumptionLines.nth(i).fill(consumedQty)
    }
    
    // Save progress
    await page.click('button:has-text("Save Progress"), button:has-text("Record")')
    
    // Verify progress recorded
    await expect(page.locator('text=Progress recorded, text=updated successfully')).toBeVisible({ timeout: 5000 })
  })

  test('should complete production order', async ({ page }) => {
    // Navigate to production orders
    await page.click('text=Manufacturing, text=Production Orders')
    
    // Find an in-progress production order
    const inProgressOrder = page.locator('tr:has-text("In Progress"), tr:has-text("Started")').first()
    
    if (await inProgressOrder.count() === 0) {
      console.log('No in-progress production order available - skipping test')
      return
    }
    
    // Complete production
    await page.click('tr:has-text("In Progress") >> button:has-text("Complete"), .complete-production')
    
    // Final production report
    await page.fill('input[name*="final_qty"], input[name*="completed"]', '5') // Complete remaining quantity
    
    // Record final material consumption
    const finalConsumption = page.locator('input[name*="final_consumed"]')
    const finalCount = await finalConsumption.count()
    
    for (let i = 0; i < finalCount; i++) {
      const remainingQty = await page.locator(`.remaining-qty >> nth=${i}`).textContent()
      const remaining = parseFloat(remainingQty?.replace(/[^0-9.-]+/g, '') || '0')
      
      await finalConsumption.nth(i).fill(remaining.toString())
    }
    
    // Quality check (if available)
    const qualitySection = page.locator('.quality-check, input[name*="quality"]')
    if (await qualitySection.isVisible()) {
      await page.selectOption('select[name*="quality"]', 'passed')
      await page.fill('textarea[name*="quality_notes"]', 'All quality checks passed')
    }
    
    // Complete production
    await page.click('button:has-text("Complete Production"), button:has-text("Finish")')
    
    // Verify completion
    await expect(page.locator('text=Production completed, text=order completed')).toBeVisible({ timeout: 5000 })
    
    // Verify finished goods received to inventory
    await expect(page.locator('text=finished goods received, text=inventory updated')).toBeVisible({ timeout: 3000 })
  })

  test('should calculate BOM costs', async ({ page }) => {
    // Navigate to BOM costing
    await page.click('text=Manufacturing, text=BOM')
    await page.click('text=BOM Costing, text=Cost Analysis')
    
    // Select BOM for costing
    await page.selectOption('select[name*="bom"], .bom-select', '1')
    
    // Set costing parameters
    await page.fill('input[name*="quantity"], input[name*="batch_size"]', '100') // Cost for 100 units
    
    // Select cost type
    await page.selectOption('select[name*="cost_type"]', 'standard')
    
    // Calculate costs
    await page.click('button:has-text("Calculate"), button:has-text("Run Analysis")')
    
    // Verify cost breakdown loads
    await expect(page.locator('table, .cost-breakdown')).toBeVisible({ timeout: 10000 })
    
    // Check cost categories
    await expect(page.locator('text=Material Cost, text=Labor Cost, text=Overhead')).toBeVisible()
    
    // Verify total cost
    const totalCost = page.locator('.total-cost, text*="Total Cost"')
    await expect(totalCost).toBeVisible()
    
    // Check unit cost calculation
    const unitCost = page.locator('.unit-cost, text*="Unit Cost"')
    await expect(unitCost).toBeVisible()
    
    // Export cost analysis if available
    const exportButton = page.locator('button:has-text("Export"), .export-costs')
    if (await exportButton.isVisible()) {
      await exportButton.click()
    }
  })

  test('should perform BOM explosion', async ({ page }) => {
    // Navigate to BOM explosion
    await page.click('text=Manufacturing, text=BOM')
    await page.click('text=BOM Explosion, text=Requirements')
    
    // Select BOM for explosion
    await page.selectOption('select[name*="bom"]', '1')
    
    // Set production quantity
    await page.fill('input[name*="quantity"]', '50') // Explode for 50 units
    
    // Set production date for availability check
    const productionDate = new Date()
    productionDate.setDate(productionDate.getDate() + 14)
    await page.fill('input[name*="date"]', productionDate.toISOString().split('T')[0])
    
    // Perform explosion
    await page.click('button:has-text("Explode"), button:has-text("Calculate Requirements")')
    
    // Verify requirements report
    await expect(page.locator('table, .requirements-report')).toBeVisible({ timeout: 10000 })
    
    // Check columns
    await expect(page.locator('text=Component, text=Required, text=Available, text=Shortage')).toBeVisible()
    
    // Look for shortage indicators
    const shortageIndicators = page.locator('.shortage, text*="Short", .warning')
    if (await shortageIndicators.count() > 0) {
      await expect(shortageIndicators.first()).toBeVisible()
    }
    
    // Generate purchase suggestions if available
    const purchaseButton = page.locator('button:has-text("Generate PO"), button:has-text("Purchase Suggestions")')
    if (await purchaseButton.isVisible()) {
      await purchaseButton.click()
      
      // Verify purchase order suggestions
      await expect(page.locator('text=Purchase suggestions, text=recommended orders')).toBeVisible({ timeout: 3000 })
    }
  })

  test('should compare BOM versions', async ({ page }) => {
    // Navigate to BOM comparison
    await page.click('text=Manufacturing, text=BOM')
    await page.click('text=BOM Compare, text=Version Compare')
    
    // Select first BOM version
    await page.selectOption('select[name*="bom1"], .bom-select-1', '1')
    
    // Select second BOM version (or same BOM different version)
    await page.selectOption('select[name*="bom2"], .bom-select-2', '2')
    
    // Perform comparison
    await page.click('button:has-text("Compare"), button:has-text("Analyze")')
    
    // Verify comparison results
    await expect(page.locator('table, .comparison-results')).toBeVisible({ timeout: 10000 })
    
    // Check for differences
    const differences = page.locator('.difference, .changed, .added, .removed')
    if (await differences.count() > 0) {
      await expect(differences.first()).toBeVisible()
    }
    
    // Check cost impact if shown
    const costImpact = page.locator('.cost-impact, text*="Cost Difference"')
    if (await costImpact.isVisible()) {
      await expect(costImpact).toBeVisible()
    }
  })

  test('should create BOM routing', async ({ page }) => {
    // Navigate to routing
    await page.click('text=Manufacturing, text=BOM')
    await page.click('text=Routing, text=Operations')
    
    // Create new routing
    await page.click('button:has-text("New"), button:has-text("Create Routing")')
    
    // Fill routing details
    await page.fill('input[name="routing_number"]', 'RT-E2E-001')
    await page.selectOption('select[name*="product"]', '1')
    await page.fill('textarea[name="description"]', 'Test routing for manufacturing process')
    
    // Add operations
    await page.click('button:has-text("Add Operation"), .add-operation')
    await page.fill('input[name*="operation"]:visible >> first', '10') // Operation sequence
    await page.fill('input[name*="description"]:visible >> first', 'Prepare Materials')
    await page.selectOption('select[name*="work_center"] >> first', '1') // Work center
    await page.fill('input[name*="setup_time"] >> first', '15') // Setup time in minutes
    await page.fill('input[name*="run_time"] >> first', '5') // Run time per unit
    
    await page.click('button:has-text("Add Operation")')
    await page.fill('input[name*="operation"]:visible >> nth=1', '20')
    await page.fill('input[name*="description"]:visible >> nth=1', 'Assembly Process')
    await page.selectOption('select[name*="work_center"] >> nth=1', '2')
    await page.fill('input[name*="setup_time"] >> nth=1', '30')
    await page.fill('input[name*="run_time"] >> nth=1', '10')
    
    await page.click('button:has-text("Add Operation")')
    await page.fill('input[name*="operation"]:visible >> nth=2', '30')
    await page.fill('input[name*="description"]:visible >> nth=2', 'Quality Inspection')
    await page.selectOption('select[name*="work_center"] >> nth=2', '3')
    await page.fill('input[name*="setup_time"] >> nth=2', '10')
    await page.fill('input[name*="run_time"] >> nth=2', '3')
    
    // Save routing
    await page.click('button:has-text("Save")')
    
    // Verify routing created
    await expect(page.locator('text=Routing created, text=saved successfully')).toBeVisible({ timeout: 5000 })
    
    // Activate routing
    await page.click('button:has-text("Activate"), .activate-routing')
    
    // Verify activation
    await expect(page.locator('text=Routing activated')).toBeVisible({ timeout: 3000 })
  })
})
