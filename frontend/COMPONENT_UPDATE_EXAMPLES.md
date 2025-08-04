# Component Update Examples

This document shows how to update existing components to use the new formatting system.

## Example 1: Invoice List Component

### Before (Hardcoded Formatting)
```tsx
// OLD: InvoiceList.tsx
export function InvoiceList({ invoices }: { invoices: Invoice[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Invoice #</th>
          <th>Date</th>
          <th>Customer</th>
          <th>Amount</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {invoices.map((invoice) => (
          <tr key={invoice.id}>
            <td>{invoice.invoice_number}</td>
            <td>{format(invoice.invoice_date, 'yyyy-MM-dd')}</td>
            <td>{invoice.customer.name}</td>
            <td>${invoice.total_amount.toFixed(2)}</td>
            <td>{invoice.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### After (Using Formatting Components)
```tsx
// NEW: InvoiceList.tsx
import { DateDisplay } from '@/components/ui/DateDisplay';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';

export function InvoiceList({ invoices }: { invoices: Invoice[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Invoice #</th>
          <th>Date</th>
          <th>Customer</th>
          <th>Amount</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {invoices.map((invoice) => (
          <tr key={invoice.id}>
            <td>{invoice.invoice_number}</td>
            <td><DateDisplay date={invoice.invoice_date} /></td>
            <td>{invoice.customer.name}</td>
            <td><CurrencyDisplay amount={invoice.total_amount} /></td>
            <td>{invoice.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Example 2: Journal Entry Form

### Before (Manual Input Handling)
```tsx
// OLD: JournalEntryForm.tsx
export function JournalEntryForm() {
  const [lines, setLines] = useState<JournalLine[]>([]);
  
  const updateLine = (index: number, field: string, value: any) => {
    const updatedLines = [...lines];
    updatedLines[index] = { ...updatedLines[index], [field]: value };
    setLines(updatedLines);
  };

  return (
    <div>
      {lines.map((line, index) => (
        <div key={index} className="grid grid-cols-4 gap-4">
          <Input
            placeholder="Account"
            value={line.account_code}
            onChange={(e) => updateLine(index, 'account_code', e.target.value)}
          />
          <Input
            placeholder="Description"
            value={line.description}
            onChange={(e) => updateLine(index, 'description', e.target.value)}
          />
          <Input
            type="number"
            placeholder="Debit"
            value={line.debit_amount || ''}
            onChange={(e) => updateLine(index, 'debit_amount', parseFloat(e.target.value) || 0)}
          />
          <Input
            type="number"
            placeholder="Credit"
            value={line.credit_amount || ''}
            onChange={(e) => updateLine(index, 'credit_amount', parseFloat(e.target.value) || 0)}
          />
        </div>
      ))}
    </div>
  );
}
```

### After (Using CurrencyInput)
```tsx
// NEW: JournalEntryForm.tsx
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/CurrencyInput';

export function JournalEntryForm() {
  const [lines, setLines] = useState<JournalLine[]>([]);
  
  const updateLine = (index: number, field: string, value: any) => {
    const updatedLines = [...lines];
    updatedLines[index] = { ...updatedLines[index], [field]: value };
    setLines(updatedLines);
  };

  return (
    <div>
      {lines.map((line, index) => (
        <div key={index} className="grid grid-cols-4 gap-4">
          <Input
            placeholder="Account"
            value={line.account_code}
            onChange={(e) => updateLine(index, 'account_code', e.target.value)}
          />
          <Input
            placeholder="Description"
            value={line.description}
            onChange={(e) => updateLine(index, 'description', e.target.value)}
          />
          <CurrencyInput
            placeholder="Debit"
            value={line.debit_amount}
            onChange={(value) => updateLine(index, 'debit_amount', value)}
          />
          <CurrencyInput
            placeholder="Credit"
            value={line.credit_amount}
            onChange={(value) => updateLine(index, 'credit_amount', value)}
          />
        </div>
      ))}
    </div>
  );
}
```

## Example 3: Financial Report

### Before (Manual Formatting)
```tsx
// OLD: IncomeStatement.tsx
import { formatCurrency, formatDate } from '@/lib/utils';

export function IncomeStatement({ reportData }: { reportData: ReportData }) {
  const totalRevenue = reportData.revenue_items.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = reportData.expense_items.reduce((sum, item) => sum + item.amount, 0);
  const netIncome = totalRevenue - totalExpenses;

  return (
    <div className="report">
      <h1>Income Statement</h1>
      <p>Period: {formatDate(reportData.start_date)} to {formatDate(reportData.end_date)}</p>
      
      <section>
        <h2>Revenue</h2>
        {reportData.revenue_items.map((item) => (
          <div key={item.id} className="flex justify-between">
            <span>{item.description}</span>
            <span>{formatCurrency(item.amount)}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold">
          <span>Total Revenue</span>
          <span>{formatCurrency(totalRevenue)}</span>
        </div>
      </section>

      <section>
        <h2>Expenses</h2>
        {reportData.expense_items.map((item) => (
          <div key={item.id} className="flex justify-between">
            <span>{item.description}</span>
            <span>{formatCurrency(item.amount)}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold">
          <span>Total Expenses</span>
          <span>{formatCurrency(totalExpenses)}</span>
        </div>
      </section>

      <div className="flex justify-between text-xl font-bold border-t pt-4">
        <span>Net Income</span>
        <span className={netIncome >= 0 ? 'text-green-600' : 'text-red-600'}>
          {formatCurrency(netIncome)}
        </span>
      </div>
    </div>
  );
}
```

### After (Using Display Components)
```tsx
// NEW: IncomeStatement.tsx
import { DateDisplay } from '@/components/ui/DateDisplay';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';

export function IncomeStatement({ reportData }: { reportData: ReportData }) {
  const totalRevenue = reportData.revenue_items.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = reportData.expense_items.reduce((sum, item) => sum + item.amount, 0);
  const netIncome = totalRevenue - totalExpenses;

  return (
    <div className="report">
      <h1>Income Statement</h1>
      <p>
        Period: <DateDisplay date={reportData.start_date} /> to{' '}
        <DateDisplay date={reportData.end_date} />
      </p>
      
      <section>
        <h2>Revenue</h2>
        {reportData.revenue_items.map((item) => (
          <div key={item.id} className="flex justify-between">
            <span>{item.description}</span>
            <CurrencyDisplay amount={item.amount} />
          </div>
        ))}
        <div className="flex justify-between font-bold">
          <span>Total Revenue</span>
          <CurrencyDisplay amount={totalRevenue} />
        </div>
      </section>

      <section>
        <h2>Expenses</h2>
        {reportData.expense_items.map((item) => (
          <div key={item.id} className="flex justify-between">
            <span>{item.description}</span>
            <CurrencyDisplay amount={item.amount} />
          </div>
        ))}
        <div className="flex justify-between font-bold">
          <span>Total Expenses</span>
          <CurrencyDisplay amount={totalExpenses} />
        </div>
      </section>

      <div className="flex justify-between text-xl font-bold border-t pt-4">
        <span>Net Income</span>
        <CurrencyDisplay amount={netIncome} colorCode className="text-xl" />
      </div>
    </div>
  );
}
```

## Example 4: Transaction Form with Date Picker

### Before (Basic Date Input)
```tsx
// OLD: TransactionForm.tsx
export function TransactionForm() {
  const [transaction, setTransaction] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    description: ''
  });

  return (
    <form>
      <div>
        <Label>Transaction Date</Label>
        <Input
          type="date"
          value={transaction.date}
          onChange={(e) => setTransaction(prev => ({ ...prev, date: e.target.value }))}
        />
      </div>
      
      <div>
        <Label>Amount</Label>
        <Input
          type="number"
          value={transaction.amount}
          onChange={(e) => setTransaction(prev => ({ ...prev, amount: e.target.value }))}
        />
      </div>
      
      <div>
        <Label>Description</Label>
        <Input
          value={transaction.description}
          onChange={(e) => setTransaction(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>
    </form>
  );
}
```

### After (Using Formatting Components)
```tsx
// NEW: TransactionForm.tsx
import { DatePicker } from '@/components/ui/DatePicker';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function TransactionForm() {
  const [transaction, setTransaction] = useState({
    date: new Date(),
    amount: null as number | null,
    description: ''
  });

  return (
    <form>
      <div>
        <Label>Transaction Date</Label>
        <DatePicker
          value={transaction.date}
          onChange={(date) => setTransaction(prev => ({ ...prev, date: date || new Date() }))}
        />
      </div>
      
      <div>
        <Label>Amount</Label>
        <CurrencyInput
          value={transaction.amount}
          onChange={(amount) => setTransaction(prev => ({ ...prev, amount }))}
          placeholder="Enter amount"
        />
      </div>
      
      <div>
        <Label>Description</Label>
        <Input
          value={transaction.description}
          onChange={(e) => setTransaction(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Enter description"
        />
      </div>
    </form>
  );
}
```

## Example 5: Dashboard Summary Cards

### Before (Hardcoded Formatting)
```tsx
// OLD: DashboardCards.tsx
export function DashboardCards({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Today's Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${summary.daily_sales.toFixed(2)}
          </div>
          <p className="text-sm text-muted-foreground">
            +{((summary.daily_sales / summary.yesterday_sales - 1) * 100).toFixed(1)}% from yesterday
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Outstanding AR</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            ${summary.outstanding_ar.toFixed(2)}
          </div>
          <p className="text-sm text-muted-foreground">
            Last updated: {format(summary.last_updated, 'MMM dd, yyyy HH:mm')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Profit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${summary.monthly_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${summary.monthly_profit.toFixed(2)}
          </div>
          <p className="text-sm text-muted-foreground">
            This month vs last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cash Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${summary.cash_balance.toFixed(2)}
          </div>
          <p className="text-sm text-muted-foreground">
            Available funds
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### After (Using Formatting Components)
```tsx
// NEW: DashboardCards.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { DateDisplay } from '@/components/ui/DateDisplay';

export function DashboardCards({ summary }: { summary: DashboardSummary }) {
  const growthRate = ((summary.daily_sales / summary.yesterday_sales - 1) * 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Today's Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <CurrencyDisplay amount={summary.daily_sales} />
          </div>
          <p className="text-sm text-muted-foreground">
            +{growthRate.toFixed(1)}% from yesterday
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Outstanding AR</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            <CurrencyDisplay amount={summary.outstanding_ar} />
          </div>
          <p className="text-sm text-muted-foreground">
            Last updated: <DateDisplay date={summary.last_updated} showTime />
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Profit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <CurrencyDisplay amount={summary.monthly_profit} colorCode />
          </div>
          <p className="text-sm text-muted-foreground">
            This month vs last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cash Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <CurrencyDisplay amount={summary.cash_balance} />
          </div>
          <p className="text-sm text-muted-foreground">
            Available funds
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Migration Checklist

### ✅ Component Updates
- [ ] Replace hardcoded currency formatting (`${amount.toFixed(2)}`) with `<CurrencyDisplay>`
- [ ] Replace date formatting (`format(date, 'format')`) with `<DateDisplay>`
- [ ] Replace number inputs for currency with `<CurrencyInput>`
- [ ] Replace date inputs with `<DatePicker>`
- [ ] Update forms to handle proper data types (number vs string)

### ✅ Import Updates
- [ ] Add `import { DateDisplay } from '@/components/ui/DateDisplay';`
- [ ] Add `import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';`
- [ ] Add `import { CurrencyInput } from '@/components/ui/CurrencyInput';`
- [ ] Add `import { DatePicker } from '@/components/ui/DatePicker';`
- [ ] Remove old formatting utilities if no longer needed

### ✅ Data Type Updates
- [ ] Change string amounts to numbers in state
- [ ] Change string dates to Date objects in state
- [ ] Update form validation for new data types
- [ ] Update API calls to send proper data types

### ✅ Testing
- [ ] Test with different locales
- [ ] Test with different company formatting settings
- [ ] Test user preference overrides
- [ ] Test form submission with new data types
- [ ] Test edge cases (null, undefined, invalid values)

## Benefits of Migration

1. **Consistent Formatting**: All monetary and date values display consistently across the app
2. **User Preferences**: Automatic respect for user locale and company formatting settings
3. **Internationalization**: Easy support for different currencies and date formats
4. **Maintainability**: Single source of truth for formatting logic
5. **Type Safety**: Better TypeScript support with proper data types
6. **User Experience**: Smart input handling with automatic formatting
