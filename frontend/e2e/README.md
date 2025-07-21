# E2E Testing with Playwright

This directory contains end-to-end tests for the BIWI ERP frontend application using Playwright.

## Setup

### Prerequisites

1. Node.js and npm installed
2. Playwright dependencies installed: `npm install`
3. Browser binaries installed: `npx playwright install`
4. System dependencies (Linux): `sudo npx playwright install-deps`

### Configuration

1. Copy the example environment file:
   ```bash
   cp .env.e2e.example .env.local
   ```

2. Update the configuration in `.env.local` with your test environment settings:
   - `PLAYWRIGHT_BASE_URL`: Base URL of your application (default: http://localhost:3000)
   - `TEST_ADMIN_EMAIL` and `TEST_ADMIN_PASSWORD`: Admin credentials for testing
   - Other environment variables as needed

3. Ensure your backend is running and accessible at the configured URL.

## Test Structure

The E2E tests are organized by business flow:

- `auth.spec.ts` - Authentication and session management
- `gl-flow.spec.ts` - General Ledger operations
- `ar-flow.spec.ts` - Accounts Receivable workflow
- `ap-flow.spec.ts` - Accounts Payable workflow
- `inventory-flow.spec.ts` - Inventory management
- `oe-flow.spec.ts` - Order Entry and fulfillment
- `pos-flow.spec.ts` - Point of Sale operations
- `bom-flow.spec.ts` - Bill of Materials and manufacturing

## Running Tests

### All Tests
```bash
npm run test:e2e
```

### Specific Test File
```bash
npx playwright test auth.spec.ts
```

### Interactive Mode (with UI)
```bash
npm run test:e2e:ui
```

### Debug Mode
```bash
npm run test:e2e:debug
```

### Headed Mode (see browser)
```bash
npm run test:e2e:headed
```

### Specific Test or Group
```bash
# Run only authentication tests
npx playwright test --grep "Authentication"

# Run a specific test
npx playwright test --grep "should login successfully"
```

## Test Environment

### Test Data Setup

The tests include a setup file (`setup.ts`) that:
- Creates test customers, suppliers, and inventory items
- Verifies basic GL account structure
- Sets up any required master data

### Test Isolation

Each test:
- Starts with a fresh login session
- Uses unique reference numbers (with timestamps or test-specific prefixes)
- Avoids dependencies on data from other tests

### Cleanup

Tests are designed to be idempotent and can be run multiple times. Some helper functions are provided for cleanup operations.

## Test Configuration

### Playwright Configuration

The `playwright.config.ts` file includes:
- Test directory: `./e2e`
- Base URL: `http://localhost:3000`
- Retry policy: 2 retries on CI, 0 locally
- Parallel execution: Full parallel locally, sequential on CI
- HTML reporter for results
- Automatic web server startup

### Browser Configuration

Currently configured to run on:
- Chromium (Desktop Chrome simulation)

Additional browsers can be added in the config file.

## Best Practices

### Test Structure

1. **Use descriptive test names** that explain the business scenario
2. **Group related tests** in describe blocks by business area
3. **Use beforeEach** for common setup (login, navigation)
4. **Include verification steps** to ensure operations completed successfully

### Selectors

1. **Prefer semantic selectors** over CSS classes:
   ```typescript
   // Good
   page.click('button:has-text("Save")')
   page.fill('input[name="email"]', 'test@example.com')
   
   // Avoid
   page.click('.btn-primary')
   page.fill('#email-field', 'test@example.com')
   ```

2. **Use flexible selectors** that work across different layouts:
   ```typescript
   // Multiple selector options
   page.click('button:has-text("New"), button:has-text("Create"), .add-button')
   ```

### Assertions

1. **Include timeout expectations** for dynamic content:
   ```typescript
   await expect(page.locator('text=Success')).toBeVisible({ timeout: 5000 })
   ```

2. **Verify both success and error scenarios**

3. **Check data integrity** after operations (totals, balances, etc.)

### Error Handling

1. **Handle optional elements** gracefully:
   ```typescript
   const dialog = page.locator('.confirmation-dialog')
   if (await dialog.isVisible({ timeout: 2000 })) {
     await dialog.locator('button:has-text("Confirm")').click()
   }
   ```

2. **Include fallback scenarios** for different UI states

## Troubleshooting

### Common Issues

1. **Test Timeouts**
   - Increase timeout values in configuration
   - Check if application is running and accessible
   - Verify network connectivity

2. **Element Not Found**
   - Check if selectors match the current UI
   - Ensure elements are visible before interaction
   - Use `page.waitForSelector()` for dynamic content

3. **Authentication Issues**
   - Verify test credentials are correct
   - Check if login flow has changed
   - Ensure session management works correctly

4. **Data Dependencies**
   - Verify test setup creates required master data
   - Check if previous tests left the system in unexpected state
   - Consider using database reset between test runs

### Debugging

1. **Use headed mode** to see browser interactions:
   ```bash
   npm run test:e2e:headed
   ```

2. **Enable debug mode** for step-by-step execution:
   ```bash
   npm run test:e2e:debug
   ```

3. **Add console logs** for debugging:
   ```typescript
   console.log('Current URL:', page.url())
   console.log('Element count:', await page.locator('.item').count())
   ```

4. **Take screenshots** for debugging:
   ```typescript
   await page.screenshot({ path: 'debug-screenshot.png' })
   ```

## Continuous Integration

For CI environments:

1. **Set environment variables**:
   ```bash
   export CI=true
   export PLAYWRIGHT_BASE_URL=https://staging.yourapp.com
   ```

2. **Run with appropriate settings**:
   ```bash
   npx playwright test --reporter=html
   ```

3. **Store test results** and artifacts

## Extending Tests

### Adding New Test Files

1. Create new `.spec.ts` file in the `e2e` directory
2. Follow the existing naming convention: `feature-flow.spec.ts`
3. Include proper test structure with describe blocks and beforeEach setup

### Adding Test Helpers

1. Add reusable functions to `setup.ts`
2. Create page object models for complex UI interactions
3. Add data factories for creating test data

### Custom Matchers

Extend Playwright with custom matchers for business-specific assertions:

```typescript
// Example: Custom matcher for currency amounts
expect.extend({
  async toHaveCurrencyValue(locator, expected) {
    const text = await locator.textContent()
    const value = parseFloat(text.replace(/[^0-9.-]+/g, ''))
    return {
      pass: Math.abs(value - expected) < 0.01,
      message: () => `Expected ${value} to equal ${expected}`
    }
  }
})
```

## Reporting

Test results are generated in HTML format and can be viewed by opening `playwright-report/index.html` after test execution.

The report includes:
- Test execution summary
- Detailed test results
- Screenshots on failures
- Execution traces
- Performance metrics
