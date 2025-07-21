import { test, expect } from '@playwright/test'

test.describe('Application Discovery', () => {
  test('discover login form elements', async ({ page }) => {
    await page.goto('/')
    
    console.log('Page title:', await page.title())
    console.log('Page URL:', page.url())
    
    // Take a screenshot for reference
    await page.screenshot({ path: 'test-results/login-page.png' })
    
    // Find all input fields
    const inputs = await page.locator('input').all()
    console.log('Input fields found:', inputs.length)
    
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i]
      const type = await input.getAttribute('type')
      const name = await input.getAttribute('name')
      const placeholder = await input.getAttribute('placeholder')
      console.log(`Input ${i}: type=${type}, name=${name}, placeholder=${placeholder}`)
    }
    
    // Find all buttons
    const buttons = await page.locator('button').all()
    console.log('Buttons found:', buttons.length)
    
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i]
      const text = await button.textContent()
      const type = await button.getAttribute('type')
      console.log(`Button ${i}: text="${text}", type=${type}`)
    }
    
    // Check if we're on login page
    const emailField = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]')
    const passwordField = page.locator('input[type="password"], input[name="password"], input[placeholder*="password" i]')
    
    if (await emailField.count() > 0 && await passwordField.count() > 0) {
      console.log('✓ Login form detected')
      
      // Try to find any demo/test credentials mentioned in the UI
      const pageContent = await page.content()
      if (pageContent.includes('demo') || pageContent.includes('test') || pageContent.includes('admin')) {
        console.log('Demo/test credentials may be mentioned in the UI')
      }
    } else {
      console.log('✗ Login form not detected - may already be authenticated or different UI')
    }
  })

  test('check if already authenticated', async ({ page }) => {
    await page.goto('/')
    
    // Wait a moment for redirects
    await page.waitForTimeout(2000)
    
    const currentUrl = page.url()
    console.log('Final URL after navigation:', currentUrl)
    
    // Check common authenticated page indicators
    const dashboardIndicators = [
      'text=Dashboard',
      'text=Welcome',
      'nav',
      '.sidebar',
      '.menu',
      'text=Logout',
      'text=Sign Out'
    ]
    
    for (const indicator of dashboardIndicators) {
      const element = page.locator(indicator)
      if (await element.count() > 0) {
        console.log(`✓ Found authenticated page indicator: ${indicator}`)
        
        // Try to find user info or logout
        const userInfo = page.locator('.user-info, .profile, [data-testid="user"]')
        if (await userInfo.count() > 0) {
          const userText = await userInfo.textContent()
          console.log('User info:', userText)
        }
        
        return
      }
    }
    
    console.log('✗ No authenticated page indicators found')
  })
})
