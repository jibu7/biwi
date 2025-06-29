import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { inventoryService } from '@/services/inventoryService';
import { InventoryItem } from '@/types/pos';
import { Search, Scan, X } from 'lucide-react';

interface ItemSearchProps {
  onItemSelect: (item: InventoryItem) => void;
}

export function ItemSearch({ onItemSelect }: ItemSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeMode, setBarcodeMode] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const { data: allItems, isLoading } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: () => inventoryService.getInventoryItems(),
  });

  // Filter items based on search term
  const searchResults = searchTerm.length > 2 
    ? allItems?.filter((item: any) => 
        item.item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      ) || []
    : [];

  // Focus barcode input when entering barcode mode
  useEffect(() => {
    if (barcodeMode && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [barcodeMode]);

  const handleItemSelect = (item: any) => {
    // Transform inventory item to match our interface
    const posItem: InventoryItem = {
      id: item.id,
      item_code: item.item_code,
      description: item.description,
      selling_price: item.selling_price || 0,
      cost_price: item.cost_price || 0,
      is_active: item.is_active,
    };
    onItemSelect(posItem);
    setSearchTerm('');
    setBarcodeInput('');
  };

  const handleBarcodeSearch = () => {
    if (!barcodeInput.trim()) return;

    // Search for item by barcode
    const foundItem = allItems?.find((item: any) => 
      item.barcode === barcodeInput.trim() || 
      item.item_code === barcodeInput.trim()
    );

    if (foundItem) {
      handleItemSelect(foundItem);
      setBarcodeMode(false);
      setBarcodeInput('');
    } else {
      alert('Item not found with barcode: ' + barcodeInput);
    }
  };

  const handleBarcodeKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBarcodeSearch();
    } else if (e.key === 'Escape') {
      setBarcodeMode(false);
      setBarcodeInput('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {!barcodeMode ? (
          <>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search items by code or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setBarcodeMode(true)}
              className="flex items-center gap-2"
            >
              <Scan className="h-4 w-4" />
              Scan
            </Button>
          </>
        ) : (
          <>
            <div className="flex-1 relative">
              <Scan className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                ref={barcodeInputRef}
                placeholder="Scan or enter barcode..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={handleBarcodeKeyPress}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setBarcodeMode(false);
                setBarcodeInput('');
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
        
        <Button
          variant="outline"
          onClick={() => {
            setSearchTerm('');
            setBarcodeInput('');
            setBarcodeMode(false);
          }}
          disabled={!searchTerm && !barcodeInput}
        >
          Clear
        </Button>
      </div>

      {!barcodeMode && searchTerm.length > 2 && (
        <div className="max-h-64 overflow-y-auto border rounded-md">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Searching...</div>
          ) : searchResults && searchResults.length > 0 ? (
            <div className="divide-y">
              {searchResults.map((item: any) => (
                <div
                  key={item.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleItemSelect(item)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{item.item_code}</div>
                      <div className="text-sm text-gray-600">{item.description}</div>
                      {item.barcode && (
                        <div className="text-xs text-gray-500">Barcode: {item.barcode}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${(item.selling_price || 0).toFixed(2)}</div>
                      <div className="text-sm text-gray-500">
                        Stock: {item.stock_quantity || 0}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : searchTerm.length > 2 ? (
            <div className="p-4 text-center text-gray-500">No items found</div>
          ) : null}
        </div>
      )}

      {barcodeMode && (
        <div className="bg-blue-50 p-4 rounded-md">
          <div className="text-sm font-medium text-blue-800 mb-2">Barcode Scan Mode</div>
          <div className="text-xs text-blue-600">
            Use a barcode scanner or manually enter the barcode/item code. Press Enter to search or Escape to cancel.
          </div>
        </div>
      )}
    </div>
  );
}
