/**
 * Utility functions for formatting numbers and currency values safely
 */

/**
 * Safely format a number to a fixed decimal place
 * @param value - The value to format (can be null, undefined, string, or number)
 * @param decimals - Number of decimal places (default: 2)
 * @param defaultValue - Default value to return if value is null/undefined/invalid (default: '0.00')
 * @returns Formatted string
 */
export function safeToFixed(value: number | string | null | undefined, decimals: number = 2, defaultValue: string = '0.00'): string {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  
  // Convert to number if it's a string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Check if the conversion resulted in a valid number
  if (isNaN(numValue)) {
    return defaultValue;
  }
  
  return numValue.toFixed(decimals);
}

/**
 * Safely format a currency value
 * @param value - The value to format (can be null, undefined, string, or number)
 * @param currencySymbol - Currency symbol to prepend (default: '$')
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string
 */
export function safeCurrency(value: number | string | null | undefined, currencySymbol: string = '$', decimals: number = 2): string {
  const formatted = safeToFixed(value, decimals);
  return `${currencySymbol}${formatted}`;
}

/**
 * Safely format a quantity value
 * @param value - The number to format (can be null, undefined, or number)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted quantity string
 */
export function safeQuantity(value: number | null | undefined, decimals: number = 2): string {
  return safeToFixed(value, decimals);
}

/**
 * Safely format a percentage value
 * @param value - The number to format (can be null, undefined, or number)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string
 */
export function safePercentage(value: number | null | undefined, decimals: number = 2): string {
  const formatted = safeToFixed(value, decimals);
  return `${formatted}%`;
}

/**
 * Safely sum an array of numbers, handling null/undefined values
 * @param values - Array of numbers that may contain null/undefined values
 * @returns Sum of all valid numbers
 */
export function safeSum(values: (number | null | undefined)[]): number {
  return values.reduce((sum: number, value) => sum + (value || 0), 0);
}

/**
 * Calculate the cost value based on cost type selection
 * @param item - Inventory item with cost data
 * @param costType - Type of cost to use ('average', 'standard', 'selling')
 * @param quantity - Quantity to calculate for
 * @returns Calculated cost value
 */
export function calculateCostValue(
  item: { average_cost?: number; standard_cost?: number; selling_price?: number }, 
  costType: 'average' | 'standard' | 'selling',
  quantity: number | null | undefined
): number {
  const qty = quantity || 0;
  
  switch (costType) {
    case 'average':
      return (item.average_cost || 0) * qty;
    case 'standard':
      return (item.standard_cost || 0) * qty;
    case 'selling':
      return (item.selling_price || 0) * qty;
    default:
      return 0;
  }
}

/**
 * Get the display name for cost types
 * @param costType - Cost type identifier
 * @returns Human-readable cost type name
 */
export function getCostTypeDisplayName(costType: 'average' | 'standard' | 'selling'): string {
  switch (costType) {
    case 'average':
      return 'Average Cost';
    case 'standard':
      return 'Standard Cost';
    case 'selling':
      return 'Selling Price';
    default:
      return 'Unknown Cost Type';
  }
}

/**
 * Get the unit cost for a cost type
 * @param item - Inventory item with cost data
 * @param costType - Type of cost to get
 * @returns Unit cost value
 */
export function getUnitCost(
  item: { average_cost?: number; standard_cost?: number; selling_price?: number },
  costType: 'average' | 'standard' | 'selling'
): number {
  switch (costType) {
    case 'average':
      return item.average_cost || 0;
    case 'standard':
      return item.standard_cost || 0;
    case 'selling':
      return item.selling_price || 0;
    default:
      return 0;
  }
}

/**
 * Safely format a date to a readable string
 * @param value - The date value to format (can be string or Date)
 * @returns Formatted date string
 */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return 'N/A';
  
  try {
    const date = typeof value === 'string' ? new Date(value) : value;
    return date.toLocaleDateString();
  } catch (error) {
    return 'Invalid Date';
  }
}
