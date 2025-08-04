import React from 'react';
import { ReceiptData } from '@/types/pos';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export function Receipt({ data }: { data: ReceiptData }) {
  return (
    <div className="receipt-print-area bg-white p-4 max-w-xs mx-auto font-mono text-xs">
      {/* Company Header */}
      <div className="text-center mb-4">
        <h1 className="text-lg font-bold">{data.companyInfo.name}</h1>
        {data.companyInfo.address && (
          <p>{data.companyInfo.address}</p>
        )}
        {data.companyInfo.contactInfo?.phone && (
          <p>Tel: {data.companyInfo.contactInfo.phone}</p>
        )}
      </div>
      
      {/* Custom Header */}
      {data.receiptHeader && (
        <div className="text-center mb-4">
          <p>{data.receiptHeader}</p>
        </div>
      )}
      
      {/* Transaction Info */}
      <div className="mb-4">
        <p>Date: {formatDateTime(data.transaction.transaction_date)}</p>
        <p>Receipt #: {data.transaction.id}</p>
        <p>Till: {data.tillInfo.name}</p>
        <p>Cashier: {data.cashierName}</p>
      </div>
      
      {/* Line Items */}
      <div className="border-t border-b py-2 mb-2">
        {data.transaction.lines.map((line) => (
          <div key={line.id}>
            <div className="flex justify-between">
              <span className="flex-1">{line.inventory_item_name || 'Item'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>{line.quantity} x {formatCurrency(line.unit_price)}</span>
              <span>{formatCurrency(line.line_total)}</span>
            </div>
            {line.discount_amount && line.discount_amount > 0 && (
              <div className="text-xs text-right">
                Discount: -{formatCurrency(line.discount_amount)}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Totals */}
      <div className="mb-4">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(data.transaction.subtotal_amount)}</span>
        </div>
        {data.transaction.discount_amount && data.transaction.discount_amount > 0 && (
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>-{formatCurrency(data.transaction.discount_amount)}</span>
          </div>
        )}
        {data.transaction.tax_amount && data.transaction.tax_amount > 0 && (
          <div className="flex justify-between">
            <span>Tax:</span>
            <span>{formatCurrency(data.transaction.tax_amount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-sm">
          <span>Total:</span>
          <span>{formatCurrency(data.transaction.total_amount)}</span>
        </div>
      </div>
      
      {/* Payment */}
      <div className="border-t pt-2 mb-4">
        <div className="flex justify-between">
          <span>{data.transaction.payment_method}:</span>
          <span>{formatCurrency(data.transaction.total_amount)}</span>
        </div>
      </div>
      
      {/* Custom Footer */}
      {data.receiptFooter && (
        <div className="text-center text-xs">
          <p>{data.receiptFooter}</p>
        </div>
      )}
      
      {/* Default Footer */}
      <div className="text-center text-xs mt-4">
        <p>Thank you for your business!</p>
      </div>
    </div>
  );
}

// Print function
export const printReceipt = () => {
  window.print();
};
