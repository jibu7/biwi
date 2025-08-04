import { render, screen } from '@testing-library/react';
import { DateDisplay } from '../DateDisplay';
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
  date_format: 'YYYY-MM-DD',
  time_format: '24h' as const
};

describe('DateDisplay', () => {
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

  it('formats date correctly with ISO format', () => {
    const testDate = new Date('2024-12-31T10:30:00Z');
    
    render(
      <FormattingProvider>
        <DateDisplay date={testDate} />
      </FormattingProvider>
    );
    
    expect(screen.getByText('2024-12-31')).toBeInTheDocument();
  });

  it('formats date with DD/MM/YYYY format', () => {
    mockUseAuth.mockReturnValue({
      ...mockUseAuth(),
      company: {
        ...mockCompany,
        date_format: 'DD/MM/YYYY'
      }
    });

    const testDate = new Date('2024-12-31T10:30:00Z');
    
    render(
      <FormattingProvider>
        <DateDisplay date={testDate} />
      </FormattingProvider>
    );
    
    expect(screen.getByText('31/12/2024')).toBeInTheDocument();
  });

  it('formats datetime with time when showTime is true', () => {
    const testDate = new Date('2024-12-31T14:30:00Z');
    
    render(
      <FormattingProvider>
        <DateDisplay date={testDate} showTime />
      </FormattingProvider>
    );
    
    // Should show both date and time (adjusted for timezone)
    const element = screen.getByText(/2024-12-31.*15:30/);
    expect(element).toBeInTheDocument();
  });

  it('formats datetime with 12-hour time format', () => {
    mockUseAuth.mockReturnValue({
      ...mockUseAuth(),
      company: {
        ...mockCompany,
        time_format: '12h' as const
      }
    });

    const testDate = new Date('2024-12-31T14:30:00Z');
    
    render(
      <FormattingProvider>
        <DateDisplay date={testDate} showTime />
      </FormattingProvider>
    );
    
    // Should show 12-hour format (adjusted for timezone)
    const element = screen.getByText(/3:30 PM/);
    expect(element).toBeInTheDocument();
  });

  it('handles null date', () => {
    render(
      <FormattingProvider>
        <DateDisplay date={null} />
      </FormattingProvider>
    );
    
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('handles undefined date', () => {
    render(
      <FormattingProvider>
        <DateDisplay date={undefined} />
      </FormattingProvider>
    );
    
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('handles string date input', () => {
    render(
      <FormattingProvider>
        <DateDisplay date="2024-12-31" />
      </FormattingProvider>
    );
    
    expect(screen.getByText('2024-12-31')).toBeInTheDocument();
  });

  it('handles invalid date string', () => {
    render(
      <FormattingProvider>
        <DateDisplay date="invalid-date" />
      </FormattingProvider>
    );
    
    // Should render an empty span for invalid dates
    const spans = screen.getAllByRole('generic');
    const dateSpan = spans.find(span => span.tagName === 'SPAN');
    expect(dateSpan).toBeInTheDocument();
    expect(dateSpan).toBeEmptyDOMElement();
  });

  it('applies custom className', () => {
    render(
      <FormattingProvider>
        <DateDisplay date="2024-12-31" className="custom-class" />
      </FormattingProvider>
    );
    
    const element = screen.getByText('2024-12-31');
    expect(element).toHaveClass('custom-class');
  });

  it('respects user date format override', () => {
    mockUseAuth.mockReturnValue({
      ...mockUseAuth(),
      user: {
        ...mockUser,
        date_format_override: 'MM/DD/YYYY'
      },
      company: {
        ...mockCompany,
        date_format: 'DD/MM/YYYY'
      }
    });

    const testDate = new Date('2024-12-31T10:30:00Z');
    
    render(
      <FormattingProvider>
        <DateDisplay date={testDate} />
      </FormattingProvider>
    );
    
    // Should use user override (MM/DD/YYYY) not company default (DD/MM/YYYY)
    expect(screen.getByText('12/31/2024')).toBeInTheDocument();
  });
});
