import { render, screen } from '@testing-library/react';
import { CurrencyDisplay } from '../CurrencyDisplay';
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

describe('CurrencyDisplay', () => {
  beforeEach(() => {
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

  it('formats currency correctly with prefix symbol', () => {
    render(
      <FormattingProvider>
        <CurrencyDisplay amount={1234.56} />
      </FormattingProvider>
    );
    
    expect(screen.getByText('$1,234.56')).toBeInTheDocument();
  });

  it('formats currency with suffix symbol', () => {
    mockUseAuth.mockReturnValue({
      ...mockUseAuth(),
      company: {
        ...mockCompany,
        decimal_separator: ',',
        thousand_separator: '.',
        currency_position: 'suffix' as const,
        default_currency: {
          code: 'EUR',
          symbol: '€',
          decimal_places: 2
        }
      }
    });

    render(
      <FormattingProvider>
        <CurrencyDisplay amount={1234.56} />
      </FormattingProvider>
    );
    
    expect(screen.getByText('1.234,56 €')).toBeInTheDocument();
  });

  it('handles null amount', () => {
    render(
      <FormattingProvider>
        <CurrencyDisplay amount={null} />
      </FormattingProvider>
    );
    
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('handles undefined amount', () => {
    render(
      <FormattingProvider>
        <CurrencyDisplay amount={undefined} />
      </FormattingProvider>
    );
    
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('shows color coding for negative amounts', () => {
    render(
      <FormattingProvider>
        <CurrencyDisplay amount={-1234.56} colorCode />
      </FormattingProvider>
    );
    
    const element = screen.getByText('$-1,234.56');
    expect(element).toHaveClass('text-red-600');
  });

  it('shows color coding for positive amounts', () => {
    render(
      <FormattingProvider>
        <CurrencyDisplay amount={1234.56} colorCode />
      </FormattingProvider>
    );
    
    const element = screen.getByText('$1,234.56');
    expect(element).toHaveClass('text-green-600');
  });

  it('hides currency symbol when showCurrency is false', () => {
    render(
      <FormattingProvider>
        <CurrencyDisplay amount={1234.56} showCurrency={false} />
      </FormattingProvider>
    );
    
    expect(screen.getByText('1,234.56')).toBeInTheDocument();
    expect(screen.queryByText('$1,234.56')).not.toBeInTheDocument();
  });

  it('includes title attribute with currency code', () => {
    render(
      <FormattingProvider>
        <CurrencyDisplay amount={1234.56} />
      </FormattingProvider>
    );
    
    const element = screen.getByText('$1,234.56');
    expect(element).toHaveAttribute('title', 'USD 1234.56');
  });
});
