import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CartItem } from '@/types/pos';
import { Trash2, Plus, Minus } from 'lucide-react';

interface CartDisplayProps {
  items: CartItem[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
}

export function CartDisplay({ items, onUpdateQuantity, onRemoveItem }: CartDisplayProps) {
  if (items.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-lg font-medium">Cart is empty</div>
          <div className="text-sm">Search and add items to get started</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <h3 className="font-semibold mb-4">Shopping Cart ({items.length} items)</h3>
      
      <div className="flex-1 overflow-y-auto space-y-2">
        {items.map((item, index) => (
          <div key={`${item.item_id}-${index}`} className="border rounded-lg p-3">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="font-medium text-sm">{item.description}</div>
                <div className="text-xs text-gray-500">
                  Unit Price: ${item.unit_price.toFixed(2)}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRemoveItem(index)}
                className="ml-2 p-1 h-8 w-8"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateQuantity(index, Math.max(1, item.quantity - 1))}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => {
                    const qty = parseInt(e.target.value) || 1;
                    onUpdateQuantity(index, Math.max(1, qty));
                  }}
                  className="w-16 h-8 text-center"
                  min="1"
                />
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-right">
                <div className="font-semibold">
                  ${item.line_total.toFixed(2)}
                </div>
                {item.discount_amount > 0 && (
                  <div className="text-xs text-green-600">
                    -${item.discount_amount.toFixed(2)} discount
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
