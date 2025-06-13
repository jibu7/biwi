/**
 * Utility functions for number formatting and safe operations
 */

/**
 * Safely formats a number to a fixed number of decimal places
 * @param value - The value to format (can be number, string, null, or undefined)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number as string
 */
export function safeToFixed(value: number | string | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined || value === '') {
    return '0.00';
  }
  
  const numValue = typeof value === 'number' ? value : Number(value);
  
  if (isNaN(numValue)) {
    return '0.00';
  }
  
  return numValue.toFixed(decimals);
}

/**
 * Safely converts a value to a number
 * @param value - The value to convert
 * @param defaultValue - Default value if conversion fails (default: 0)
 * @returns Number value
 */
export function safeToNumber(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  
  const numValue = typeof value === 'number' ? value : Number(value);
  
  if (isNaN(numValue)) {
    return defaultValue;
  }
  
  return numValue;
}

/**
 * Formats a number as currency with safe handling
 * @param value - The value to format
 * @param currency - Currency code (default: 'USD')
 * @returns Formatted currency string
 */
export function formatCurrency(value: number | string | null | undefined, currency: string = 'USD'): string {
  const numValue = safeToNumber(value);
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(numValue);
}

/**
 * Safely calculates percentage with division by zero protection
 * @param numerator - The numerator value
 * @param denominator - The denominator value
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export function safePercentage(
  numerator: number | string | null | undefined, 
  denominator: number | string | null | undefined, 
  decimals: number = 1
): string {
  const num = safeToNumber(numerator);
  const den = safeToNumber(denominator);
  
  if (den === 0) {
    return '0.0';
  }
  
  return ((num / den) * 100).toFixed(decimals);
}
