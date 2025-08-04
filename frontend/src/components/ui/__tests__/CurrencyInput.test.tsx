import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CurrencyInput } from '../CurrencyInput';
import { FormattingProvider } from '@/contexts/FormattingContext';
import { useAuth } from '@/hooks/useAuth';

// Mock the useAuth hook
jest.mock('@/hooks/useAuth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const mockUser = {
  id: 1,
  email: 'test@example.com',
  user_type: 'company_user' as const,
  is_active: true,
  locale: 'en-US',
  timezone: 'UTC'
};

const mockCompany = {
  id: 1,
  name: 'Test Company',
  code: 'TEST',
  subscription_status: 'active',
  is_active: true,
  decimal_separator: '.',
  thousand_separator: ',',
  currency_position: 'prefix' as const,
  default_currency: {
    code: 'USD',
    symbol: '$',
    decimal_places: 2
  }
};

describe('CurrencyInput', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      company: mockCompany,
      isAuthenticated: true,
      isLoading: false,
      selectedCompanyId: 1,
      token: 'mock-token',
      isPlatformAdmin: false,
      login: jest.fn(),
      platformLogin: jest.fn(),
      logout: jest.fn(),
      setTargetCompany: jest.fn(),
      setSelectedCompanyId: jest.fn(),
      refreshUser: jest.fn()
    });
  });

  it('displays formatted currency when not focused', () => {
    render(
      <FormattingProvider>
        <CurrencyInput value={1234.56} onChange={mockOnChange} />
      </FormattingProvider>
    );
    
    const input = screen.getByDisplayValue('$1,234.56');
    expect(input).toBeInTheDocument();
  });

  it('shows raw value when focused', async () => {
    const user = userEvent.setup();
    
    render(
      <FormattingProvider>
        <CurrencyInput value={1234.56} onChange={mockOnChange} />
      </FormattingProvider>
    );
    
    const input = screen.getByDisplayValue('$1,234.56');
    await user.click(input);
    
    expect(input).toHaveValue('1234.56');
  });

  it('formats value when losing focus', async () => {
    const user = userEvent.setup();
    
    render(
      <FormattingProvider>
        <CurrencyInput value={null} onChange={mockOnChange} />
      </FormattingProvider>
    );
    
    const input = screen.getByRole('textbox');
    
    await user.click(input);
    await user.type(input, '1234.56');
    await user.tab(); // Lose focus
    
    expect(mockOnChange).toHaveBeenCalledWith(1234.56);
  });

  it('handles invalid input gracefully', async () => {
    const user = userEvent.setup();
    
    render(
      <FormattingProvider>
        <CurrencyInput value={null} onChange={mockOnChange} />
      </FormattingProvider>
    );
    
    const input = screen.getByRole('textbox');
    
    await user.click(input);
    await user.type(input, 'invalid');
    await user.tab();
    
    expect(mockOnChange).toHaveBeenCalledWith(0);
  });

  it('shows currency symbol in prefix position', () => {
    render(
      <FormattingProvider>
        <CurrencyInput value={100} onChange={mockOnChange} />
      </FormattingProvider>
    );
    
    const symbol = screen.getByText('$');
    expect(symbol).toBeInTheDocument();
    expect(symbol).toHaveClass('absolute left-3');
  });

  it('shows currency symbol in suffix position', () => {
    mockUseAuth.mockReturnValue({
      ...mockUseAuth(),
      company: {
        ...mockCompany,
        currency_position: 'suffix' as const,
        default_currency: {
          ...mockCompany.default_currency,
          symbol: '€'
        }
      }
    });

    render(
      <FormattingProvider>
        <CurrencyInput value={100} onChange={mockOnChange} />
      </FormattingProvider>
    );
    
    const symbol = screen.getByText('€');
    expect(symbol).toBeInTheDocument();
    expect(symbol).toHaveClass('absolute right-3');
  });

  it('hides currency symbol when showCurrency is false', () => {
    render(
      <FormattingProvider>
        <CurrencyInput value={100} onChange={mockOnChange} showCurrency={false} />
      </FormattingProvider>
    );
    
    expect(screen.queryByText('$')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('100.00')).toBeInTheDocument();
  });

  it('handles null value', () => {
    render(
      <FormattingProvider>
        <CurrencyInput value={null} onChange={mockOnChange} />
      </FormattingProvider>
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('');
  });

  it('applies proper padding for currency symbol position', () => {
    render(
      <FormattingProvider>
        <CurrencyInput value={100} onChange={mockOnChange} />
      </FormattingProvider>
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('pl-8'); // Left padding for prefix symbol
  });

  it('passes through other input props', () => {
    render(
      <FormattingProvider>
        <CurrencyInput 
          value={100} 
          onChange={mockOnChange} 
          placeholder="Enter amount"
          disabled
        />
      </FormattingProvider>
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder', 'Enter amount');
    expect(input).toBeDisabled();
  });
});
