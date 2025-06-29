import { TaxType } from '@/services/commonService';

export class TaxCalculator {
  static calculateLineTotal(line: any, taxTypes?: any[]): number {
    const subtotal = line.quantity * line.unitPrice * (1 - line.discountPercentage / 100);
    
    if (line.taxTypeId && taxTypes) {
      const taxType = taxTypes.find(t => t.id === line.taxTypeId);
      if (taxType) {
        return subtotal * (1 + taxType.ratePercentage / 100);
      }
    }
    
    return subtotal;
  }
  
  static calculateDocumentTaxes(lines: any[], taxTypes?: any[]) {
    let subtotal = 0;
    const taxes: Record<string, number> = {};
    
    lines.forEach(line => {
      const lineSubtotal = line.quantity * line.unitPrice * (1 - line.discountPercentage / 100);
      subtotal += lineSubtotal;
      
      if (line.taxTypeId && taxTypes) {
        const taxType = taxTypes.find(t => t.id === line.taxTypeId);
        if (taxType) {
          const taxAmount = lineSubtotal * (taxType.ratePercentage / 100);
          taxes[taxType.name] = (taxes[taxType.name] || 0) + taxAmount;
        }
      }
    });
    
    const totalTax = Object.values(taxes).reduce((sum, tax) => sum + tax, 0);
    
    return {
      subtotal,
      taxes,
      totalTax,
      grandTotal: subtotal + totalTax
    };
  }
}
