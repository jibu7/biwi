import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ItemSearch } from './ItemSearch';
import { CartDisplay } from './CartDisplay';
import { PaymentDialog } from './PaymentDialog';
import { CustomerSearch } from './CustomerSearch';
import { POSSession, POSTransactionCreate, CartItem, InventoryItem } from '@/types/pos';

interface POSTerminalProps {
  session: POSSession;
  onSale: (data: POSTransactionCreate) => void;
  onReturn: (data: POSTransactionCreate) => Promise<any>;
}

interface Customer {
  id: number;
  customer_code: string;
  name: string;
  contact_info?: any;
}

export function POSTerminal({ session, onSale, onReturn }: POSTerminalProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const addToCart = (item: InventoryItem) => {
    const existing = cart.find(c => c.item_id === item.id);
    if (existing) {
      setCart(cart.map(c => 
        c.item_id === item.id 
          ? { ...c, quantity: c.quantity + 1, line_total: (c.quantity + 1) * c.unit_price }
          : c
      ));
    } else {
      setCart([...cart, {
        item_id: item.id,
        description: item.description,
        quantity: 1,
        unit_price: item.selling_price,
        discount_percentage: 0,
        discount_amount: 0,
        tax_amount: 0,
        line_total: item.selling_price,
      }]);
    }
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.line_total, 0);
    const tax = cart.reduce((sum, item) => sum + item.tax_amount, 0);
    const discount = cart.reduce((sum, item) => sum + item.discount_amount, 0);
    return {
      subtotal,
      tax,
      discount,
      total: subtotal + tax - discount,
    };
  };

  const handlePayment = (paymentMethod: string, cashTendered?: number) => {
    const totals = calculateTotals();
    
    const transactionData: POSTransactionCreate = {
      transaction_type_id: 1, // Default sale type
      customer_id: selectedCustomer?.id,
      payment_method: paymentMethod as 'cash' | 'card' | 'check' | 'other',
      payment_reference: cashTendered ? `Cash: $${cashTendered}` : undefined,
      notes: undefined,
      lines: cart.map((item, index) => ({
        line_number: index + 1,
        inventory_item_id: item.item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_amount: item.discount_amount,
        tax_amount: item.tax_amount,
        line_total: item.line_total
      }))
    };

    onSale(transactionData);

    // Clear cart after successful sale
    setCart([]);
    setSelectedCustomer(null);
    setShowPayment(false);
  };

  return (
    <div className="grid grid-cols-12 gap-4 h-[calc(100vh-8rem)]">
      {/* Left Panel - Item Search & Cart */}
      <div className="col-span-8 space-y-4">
        <Card className="p-4">
          <ItemSearch onItemSelect={addToCart} />
        </Card>
        
        <Card className="flex-1 p-4">
          <CartDisplay
            items={cart}
            onUpdateQuantity={(index, quantity) => {
              const newCart = [...cart];
              newCart[index].quantity = quantity;
              newCart[index].line_total = quantity * newCart[index].unit_price;
              setCart(newCart);
            }}
            onRemoveItem={(index) => {
              setCart(cart.filter((_, i) => i !== index));
            }}
          />
        </Card>
      </div>

      {/* Right Panel - Customer & Payment */}
      <div className="col-span-4 space-y-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Session Info</h3>
          <div className="text-sm space-y-1">
            <div>Till: {session.till_name}</div>
            <div>Cashier: {session.cashier_name}</div>
            <div>Session: #{session.id}</div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-2">Customer</h3>
          <CustomerSearch
            selectedCustomer={selectedCustomer}
            onSelectCustomer={setSelectedCustomer}
          />
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-2">Order Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${calculateTotals().subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>${calculateTotals().tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount</span>
              <span>-${calculateTotals().discount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total</span>
              <span>${calculateTotals().total.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        <div className="space-y-2">
          <Button
            className="w-full"
            size="lg"
            onClick={() => setShowPayment(true)}
            disabled={cart.length === 0}
          >
            Process Payment
          </Button>
          
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setCart([])}>
              Clear Cart
            </Button>
            <Button variant="outline" onClick={() => {/* Hold sale */}}>
              Hold Sale
            </Button>
          </div>
        </div>
      </div>

      {showPayment && (
        <PaymentDialog
          total={calculateTotals().total}
          onPayment={handlePayment}
          onClose={() => setShowPayment(false)}
        />
      )}
    </div>
  );
}
