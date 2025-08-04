import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { format as dateFnsFormat, parse as dateFnsParse } from 'date-fns';
import { enUS, enGB, de, fr, es } from 'date-fns/locale';

interface FormattingConfig {
  dateFormat: string;
  dateFormatFns: string;
  timeFormat: '12h' | '24h';
  decimalSeparator: string;
  thousandSeparator: string;
  currencyCode: string;
  currencySymbol: string;
  currencyPosition: 'prefix' | 'suffix';
  currencyDecimalPlaces: number;
  locale: string;
  timezone: string;
}

interface FormattingContextType extends FormattingConfig {
  formatDate: (date: Date | string | null | undefined) => string;
  formatDateTime: (date: Date | string | null | undefined) => string;
  formatCurrency: (amount: number | null | undefined) => string;
  formatNumber: (number: number, decimals?: number) => string;
  parseDate: (dateStr: string) => Date | null;
  parseCurrency: (currencyStr: string) => number;
  getDatePickerFormat: () => string;
}

const FormattingContext = createContext<FormattingContextType | undefined>(undefined);

// Map backend date formats to date-fns formats
const DATE_FORMAT_MAP: Record<string, string> = {
  'DD/MM/YYYY': 'dd/MM/yyyy',
  'MM/DD/YYYY': 'MM/dd/yyyy',
  'YYYY-MM-DD': 'yyyy-MM-dd',
  'DD.MM.YYYY': 'dd.MM.yyyy',
  'DD-MM-YYYY': 'dd-MM-yyyy',
  'YYYY/MM/DD': 'yyyy/MM/dd',
};

// Map locales to date-fns locale objects
const LOCALE_MAP: Record<string, any> = {
  'en-US': enUS,
  'en-GB': enGB,
  'de-DE': de,
  'fr-FR': fr,
  'es-ES': es,
};

export function FormattingProvider({ children }: { children: ReactNode }) {
  const { user, company } = useAuth();
  
  // Get formatting config from user data with company fallbacks
  const config: FormattingConfig = {
    dateFormat: user?.date_format_override || company?.date_format || 'YYYY-MM-DD',
    dateFormatFns: DATE_FORMAT_MAP[user?.date_format_override || company?.date_format || 'YYYY-MM-DD'] || 'yyyy-MM-dd',
    timeFormat: company?.time_format || '24h',
    decimalSeparator: company?.decimal_separator || '.',
    thousandSeparator: company?.thousand_separator || ',',
    currencyCode: company?.default_currency?.code || company?.default_currency_code || 'USD',
    currencySymbol: company?.default_currency?.symbol || '$',
    currencyPosition: company?.currency_position || 'prefix',
    currencyDecimalPlaces: company?.default_currency?.decimal_places || 2,
    locale: user?.locale || 'en-US',
    timezone: user?.timezone || 'UTC',
  };

  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';
    
    const formatStr = config.dateFormatFns;
    const locale = LOCALE_MAP[config.locale] || enUS;
    
    return dateFnsFormat(dateObj, formatStr, { locale });
  };

  const formatDateTime = (date: Date | string | null | undefined): string => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';
    
    const dateStr = formatDate(dateObj);
    const timeFormat = config.timeFormat === '12h' ? 'h:mm a' : 'HH:mm';
    const locale = LOCALE_MAP[config.locale] || enUS;
    const timeStr = dateFnsFormat(dateObj, timeFormat, { locale });
    
    return `${dateStr} ${timeStr}`;
  };

  const formatNumber = (number: number, decimals: number = 2): string => {
    const parts = number.toFixed(decimals).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, config.thousandSeparator);
    
    if (parts.length > 1 && decimals > 0) {
      return integerPart + config.decimalSeparator + parts[1];
    }
    
    return integerPart;
  };

  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined) return '';
    
    const formattedNumber = formatNumber(amount, config.currencyDecimalPlaces);
    
    if (config.currencyPosition === 'prefix') {
      return `${config.currencySymbol}${formattedNumber}`;
    } else {
      return `${formattedNumber} ${config.currencySymbol}`;
    }
  };

  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    
    try {
      const formatStr = config.dateFormatFns;
      const locale = LOCALE_MAP[config.locale] || enUS;
      return dateFnsParse(dateStr, formatStr, new Date(), { locale });
    } catch {
      return null;
    }
  };

  const parseCurrency = (currencyStr: string): number => {
    if (!currencyStr) return 0;
    
    // Remove currency symbol and spaces
    let cleaned = currencyStr.replace(config.currencySymbol, '').trim();
    
    // Replace separators
    cleaned = cleaned.replace(new RegExp(`\\${config.thousandSeparator}`, 'g'), '');
    cleaned = cleaned.replace(config.decimalSeparator, '.');
    
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const getDatePickerFormat = (): string => {
    // Return format string for date picker components
    return config.dateFormat.toLowerCase();
  };

  const value: FormattingContextType = {
    ...config,
    formatDate,
    formatDateTime,
    formatCurrency,
    formatNumber,
    parseDate,
    parseCurrency,
    getDatePickerFormat,
  };

  return (
    <FormattingContext.Provider value={value}>
      {children}
    </FormattingContext.Provider>
  );
}

export const useFormatting = () => {
  const context = useContext(FormattingContext);
  if (!context) {
    throw new Error('useFormatting must be used within FormattingProvider');
  }
  return context;
};
