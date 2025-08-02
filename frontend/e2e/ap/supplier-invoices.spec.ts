
import { test, expect } from '@playwright/test';

async function login(page: any, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL('/');
}

async function createSupplier(page: any, code: string, name: string) {
  await page.goto('/purchasing/suppliers/new');
  await page.getByLabel('Supplier Code').fill(code);
  await page.getByLabel('Supplier Name').fill(name);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Supplier created successfully')).toBeVisible();
}

async function createGLAccount(page: any, code: string, name: string, type: string) {
  await page.goto('/accounting/gl-accounts/new');
  await page.getByLabel('Account Code').fill(code);
  await page.getByLabel('Account Name').fill(name);
  await page.getByLabel('Account Type').selectOption(type);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('GL account created successfully')).toBeVisible();
}

test.describe('Supplier Invoice Processing', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin@acme001.com', 'admin123');
    await createSupplier(page, 'SUPP001', 'Test Supplier');
    await createGLAccount(page, '2100', 'Accounts Payable', 'Liability');
    await createGLAccount(page, '5010', 'Cost of Goods Sold', 'Expense');
  });

  test('should process supplier invoice', async ({ page }) => {
    await page.goto('/transactions/ap/invoices/new');
    
    await page.getByLabel('Supplier').selectOption({ label: 'SUPP001 - Test Supplier' });
    await page.getByLabel('Transaction Date').fill('2024-01-01');
    await page.getByLabel('Due Date').fill('2024-01-31');
    await page.getByLabel('Reference').fill('BILL001');
    await page.getByLabel('Total Amount').fill('5000');
    await page.getByRole('button', { name: 'Save' }).click();
    
    await expect(page.getByText('Supplier invoice created successfully')).toBeVisible();
    
    // Verify GL posting
    await page.goto('/reports/gl/account-transactions');
    await page.getByLabel('Account').selectOption({ label: '2100 - Accounts Payable' });
    await page.getByTestId('search-btn').click();
    await expect(page.getByRole('cell', { name: 'BILL001' }).locator('..')).toContainText('5,000.00');
  });
});
