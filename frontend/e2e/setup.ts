import { test as setup, expect, Page } from '@playwright/test'

/**
 * Global setup for E2E tests
 * This runs once before all tests to prepare test data and environment
 */

setup('Setup test environment', async ({ page }) => {
  console.log('Setting up test environment...')
  
  // Login as admin to set up test data
  await page.goto('/')
  await page.fill('input[name="email"], input[type="email"]', 'admin@example.com')
  await page.fill('input[name="password"], input[type="password"]', 'admin123')
  await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")')
  
  // Wait for successful login
  await expect(page).toHaveURL(/dashboard|app|home/, { timeout: 10000 })
  
  // Setup test customers (if needed)
  try {
    await page.click('text=Customers, nav >> text=Customers', { timeout: 3000 })
    
    // Check if test customer exists
    const existingCustomer = page.locator('text=Test Customer Ltd')
    if (await existingCustomer.count() === 0) {
      await page.click('button:has-text("New"), button:has-text("Add Customer")')
      await page.fill('input[name="name"], input[name="customer_name"]', 'Test Customer Ltd')
      await page.fill('input[name="email"]', 'test.customer@example.com')
      await page.fill('input[name="phone"]', '+1-555-123-4567')
      await page.click('button:has-text("Save")')
      await expect(page.locator('text=Customer created, text=Success')).toBeVisible({ timeout: 5000 })
      console.log('✓ Test customer created')
    }
  } catch (error) {
    console.log('Note: Customer setup skipped -', error)
  }
  
  // Setup test suppliers (if needed)
  try {
    await page.click('text=Suppliers, nav >> text=Suppliers', { timeout: 3000 })
    
    const existingSupplier = page.locator('text=Test Supplier Inc')
    if (await existingSupplier.count() === 0) {
      await page.click('button:has-text("New"), button:has-text("Add Supplier")')
      await page.fill('input[name="name"], input[name="supplier_name"]', 'Test Supplier Inc')
      await page.fill('input[name="email"]', 'test.supplier@example.com')
      await page.fill('input[name="phone"]', '+1-555-987-6543')
      await page.click('button:has-text("Save")')
      await expect(page.locator('text=Supplier created, text=Success')).toBeVisible({ timeout: 5000 })
      console.log('✓ Test supplier created')
    }
  } catch (error) {
    console.log('Note: Supplier setup skipped -', error)
  }
  
  // Setup test inventory items (if needed)
  try {
    await page.click('text=Inventory, nav >> text=Inventory', { timeout: 3000 })
    
    const existingItem = page.locator('text=TEST-ITEM-001')
    if (await existingItem.count() === 0) {
      await page.click('button:has-text("New"), button:has-text("Add Item")')
      await page.fill('input[name="sku"], input[name="code"]', 'TEST-ITEM-001')
      await page.fill('input[name="name"], input[name="description"]', 'Test Item for E2E')
      await page.fill('input[name*="cost"], input[name*="unit_cost"]', '10.00')
      await page.fill('input[name*="price"], input[name*="selling_price"]', '15.00')
      await page.click('button:has-text("Save")')
      await expect(page.locator('text=Item created, text=Success')).toBeVisible({ timeout: 5000 })
      console.log('✓ Test inventory item created')
    }
  } catch (error) {
    console.log('Note: Inventory setup skipped -', error)
  }
  
  // Setup GL accounts (if needed)
  try {
    await page.click('text=General Ledger, text=GL, nav >> text=General Ledger', { timeout: 3000 })
    await page.click('text=Accounts, text=Chart of Accounts')
    
    // Verify basic accounts exist
    const cashAccount = page.locator('text=Cash, text=1000')
    if (await cashAccount.count() === 0) {
      console.log('Note: Basic GL accounts may need to be set up manually')
    } else {
      console.log('✓ GL accounts verified')
    }
  } catch (error) {
    console.log('Note: GL setup skipped -', error)
  }
  
  console.log('Test environment setup completed')
})

/**
 * Helper function to clean up test data after tests
 */
export async function cleanupTestData(page: Page) {
  console.log('Cleaning up test data...')
  
  try {
    // Delete test transactions, orders, etc.
    // This can be expanded based on what cleanup is needed
    
    // Example: Delete test journal entries
    await page.click('text=General Ledger, nav >> text=General Ledger')
    await page.click('text=Journal Entries')
    
    const testEntries = page.locator('tr:has-text("TEST-")')
    const entryCount = await testEntries.count()
    
    for (let i = 0; i < entryCount; i++) {
      const deleteButton = testEntries.nth(i).locator('button:has-text("Delete"), .delete-button')
      if (await deleteButton.isVisible()) {
        await deleteButton.click()
        
        const confirmDelete = page.locator('button:has-text("Confirm"), button:has-text("Yes")')
        if (await confirmDelete.isVisible({ timeout: 2000 })) {
          await confirmDelete.click()
        }
      }
    }
    
    console.log('✓ Test data cleanup completed')
  } catch (error) {
    console.log('Note: Some cleanup operations may have failed:', error)
  }
}

/**
 * Helper to create test data for specific scenarios
 */
export async function createTestCustomer(page: Page, customerData: any = {}) {
  const defaultData = {
    name: 'E2E Test Customer',
    email: 'e2e.customer@test.com',
    phone: '+1-555-000-0000',
    ...customerData
  }
  
  await page.click('text=Customers, nav >> text=Customers')
  await page.click('button:has-text("New")')
  
  await page.fill('input[name="name"]', defaultData.name)
  await page.fill('input[name="email"]', defaultData.email)
  await page.fill('input[name="phone"]', defaultData.phone)
  
  await page.click('button:has-text("Save")')
  await expect(page.locator('text=Customer created')).toBeVisible({ timeout: 5000 })
  
  return defaultData
}

export async function createTestItem(page: Page, itemData: any = {}) {
  const defaultData = {
    sku: 'E2E-TEST-' + Date.now(),
    name: 'E2E Test Item',
    cost: '5.00',
    price: '10.00',
    ...itemData
  }
  
  await page.click('text=Inventory, nav >> text=Inventory')
  await page.click('button:has-text("New")')
  
  await page.fill('input[name="sku"]', defaultData.sku)
  await page.fill('input[name="name"]', defaultData.name)
  await page.fill('input[name*="cost"]', defaultData.cost)
  await page.fill('input[name*="price"]', defaultData.price)
  
  await page.click('button:has-text("Save")')
  await expect(page.locator('text=Item created')).toBeVisible({ timeout: 5000 })
  
  return defaultData
}
