import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { POSTransaction, POSSession } from '@/types/pos';
import { Printer, Download, Eye } from 'lucide-react';

interface ReceiptPrinterProps {
  transaction: POSTransaction;
  session: POSSession;
  companyInfo?: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  onClose?: () => void;
}

export function ReceiptPrinter({ transaction, session, companyInfo, onClose }: ReceiptPrinterProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handlePrint = () => {
    if (receiptRef.current) {
      const printContent = receiptRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt #${transaction.id}</title>
              <style>
                body {
                  font-family: 'Courier New', monospace;
                  font-size: 12px;
                  margin: 0;
                  padding: 20px;
                  line-height: 1.2;
                }
                .receipt {
                  width: 300px;
                  margin: 0 auto;
                }
                .center { text-align: center; }
                .right { text-align: right; }
                .bold { font-weight: bold; }
                .line { border-bottom: 1px dashed #000; margin: 5px 0; }
                .total-line { border-top: 1px solid #000; margin-top: 5px; padding-top: 5px; }
                table { width: 100%; border-collapse: collapse; }
                td { padding: 2px 0; vertical-align: top; }
              </style>
            </head>
            <body>
              <div class="receipt">
                ${printContent}
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  const handleDownload = () => {
    if (receiptRef.current) {
      const receiptContent = receiptRef.current.innerText;
      const blob = new Blob([receiptContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${transaction.id}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Receipt Preview</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* Receipt Content */}
        <div 
          ref={receiptRef}
          className="bg-white p-4 border rounded font-mono text-xs leading-tight"
          style={{ fontFamily: 'Courier New, monospace' }}
        >
          {/* Header */}
          <div className="text-center mb-4">
            <div className="font-bold text-sm">{companyInfo?.name || 'POS System'}</div>
            {companyInfo?.address && <div>{companyInfo.address}</div>}
            {companyInfo?.phone && <div>Tel: {companyInfo.phone}</div>}
            {companyInfo?.email && <div>Email: {companyInfo.email}</div>}
          </div>

          <div className="border-t border-dashed border-gray-400 my-2"></div>

          {/* Transaction Info */}
          <div className="mb-3">
            <table className="w-full">
              <tbody>
                <tr>
                  <td>Receipt #:</td>
                  <td className="text-right font-bold">{transaction.id}</td>
                </tr>
                <tr>
                  <td>Date:</td>
                  <td className="text-right">{formatDate(transaction.transaction_date)}</td>
                </tr>
                <tr>
                  <td>Till:</td>
                  <td className="text-right">{session.till_name}</td>
                </tr>
                <tr>
                  <td>Cashier:</td>
                  <td className="text-right">{transaction.cashier_name || session.cashier_name}</td>
                </tr>
                {transaction.customer_name && (
                  <tr>
                    <td>Customer:</td>
                    <td className="text-right">{transaction.customer_name}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-dashed border-gray-400 my-2"></div>

          {/* Items */}
          <div className="mb-3">
            {transaction.lines.map((line, index) => (
              <div key={index} className="mb-2">
                <div className="flex justify-between">
                  <div className="flex-1">{line.inventory_item_name || `Item ${line.inventory_item_id}`}</div>
                </div>
                <div className="flex justify-between">
                  <div>{line.quantity} x {formatCurrency(line.unit_price)}</div>
                  <div className="font-bold">{formatCurrency(line.line_total)}</div>
                </div>
                {line.discount_amount && line.discount_amount > 0 && (
                  <div className="text-right text-xs">
                    Discount: -{formatCurrency(line.discount_amount)}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-gray-400 my-2"></div>

          {/* Totals */}
          <div className="mb-3">
            <table className="w-full">
              <tbody>
                <tr>
                  <td>Subtotal:</td>
                  <td className="text-right">{formatCurrency(transaction.subtotal_amount)}</td>
                </tr>
                {transaction.discount_amount && transaction.discount_amount > 0 && (
                  <tr>
                    <td>Discount:</td>
                    <td className="text-right">-{formatCurrency(transaction.discount_amount)}</td>
                  </tr>
                )}
                {transaction.tax_amount && transaction.tax_amount > 0 && (
                  <tr>
                    <td>Tax:</td>
                    <td className="text-right">{formatCurrency(transaction.tax_amount)}</td>
                  </tr>
                )}
                <tr className="border-t border-solid border-gray-400">
                  <td className="font-bold pt-1">TOTAL:</td>
                  <td className="text-right font-bold pt-1">{formatCurrency(transaction.total_amount)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Info */}
          <div className="mb-3">
            <table className="w-full">
              <tbody>
                <tr>
                  <td>Payment:</td>
                  <td className="text-right capitalize">{transaction.payment_method}</td>
                </tr>
                {transaction.payment_reference && (
                  <tr>
                    <td>Reference:</td>
                    <td className="text-right">{transaction.payment_reference}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-dashed border-gray-400 my-2"></div>

          {/* Footer */}
          <div className="text-center mt-4">
            <div>Thank you for your business!</div>
            <div className="mt-2">Please retain this receipt</div>
            <div className="mt-2 text-xs">
              {new Date().toLocaleString()}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4">
          {onClose && (
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
          )}
          <Button onClick={handlePrint} className="flex-1">
            <Printer className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
        </div>
      </Card>
    </div>
  );
}
