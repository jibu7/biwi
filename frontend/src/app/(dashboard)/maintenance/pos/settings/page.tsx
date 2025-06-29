'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Save, Settings } from 'lucide-react';

export default function POSSettingsPage() {
  const [settings, setSettings] = useState({
    storeName: 'My Store',
    storeAddress: '123 Main St, City, State 12345',
    storePhone: '(555) 123-4567',
    taxRate: '8.25',
    currency: 'USD',
    receiptHeader: 'Thank you for your business!',
    receiptFooter: 'Please come again!',
    autoOpenCashDrawer: true,
    printReceiptAutomatically: true,
    allowNegativeInventory: false,
    requireCustomerForReturns: true,
    maxDiscountPercent: '50',
    barcodeFormat: 'UPC',
    defaultPaymentMethod: 'CASH',
  });

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Saving settings:', settings);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">POS Settings</h1>
          <p className="text-gray-600">Configure Point of Sale system preferences</p>
        </div>
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Information */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold">Store Information</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="store-name">Store Name</Label>
              <Input
                id="store-name"
                value={settings.storeName}
                onChange={(e) => setSettings(prev => ({ ...prev, storeName: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="store-address">Store Address</Label>
              <Textarea
                id="store-address"
                value={settings.storeAddress}
                onChange={(e) => setSettings(prev => ({ ...prev, storeAddress: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="store-phone">Store Phone</Label>
              <Input
                id="store-phone"
                value={settings.storePhone}
                onChange={(e) => setSettings(prev => ({ ...prev, storePhone: e.target.value }))}
              />
            </div>
          </div>
        </Card>

        {/* Financial Settings */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Financial Settings</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="tax-rate">Tax Rate (%)</Label>
              <Input
                id="tax-rate"
                type="number"
                step="0.01"
                value={settings.taxRate}
                onChange={(e) => setSettings(prev => ({ ...prev, taxRate: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select
                id="currency"
                value={settings.currency}
                onChange={(e) => setSettings(prev => ({ ...prev, currency: e.target.value }))}
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="CAD">CAD - Canadian Dollar</option>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="max-discount">Maximum Discount (%)</Label>
              <Input
                id="max-discount"
                type="number"
                min="0"
                max="100"
                value={settings.maxDiscountPercent}
                onChange={(e) => setSettings(prev => ({ ...prev, maxDiscountPercent: e.target.value }))}
              />
            </div>
          </div>
        </Card>

        {/* Receipt Settings */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Receipt Settings</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="receipt-header">Receipt Header</Label>
              <Input
                id="receipt-header"
                value={settings.receiptHeader}
                onChange={(e) => setSettings(prev => ({ ...prev, receiptHeader: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="receipt-footer">Receipt Footer</Label>
              <Input
                id="receipt-footer"
                value={settings.receiptFooter}
                onChange={(e) => setSettings(prev => ({ ...prev, receiptFooter: e.target.value }))}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="auto-print"
                checked={settings.printReceiptAutomatically}
                onChange={(e) => setSettings(prev => ({ ...prev, printReceiptAutomatically: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="auto-print">Auto-print receipts</Label>
            </div>
          </div>
        </Card>

        {/* POS Behavior */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">POS Behavior</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="auto-drawer"
                checked={settings.autoOpenCashDrawer}
                onChange={(e) => setSettings(prev => ({ ...prev, autoOpenCashDrawer: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="auto-drawer">Auto-open cash drawer</Label>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="negative-inventory"
                checked={settings.allowNegativeInventory}
                onChange={(e) => setSettings(prev => ({ ...prev, allowNegativeInventory: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="negative-inventory">Allow negative inventory</Label>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="require-customer"
                checked={settings.requireCustomerForReturns}
                onChange={(e) => setSettings(prev => ({ ...prev, requireCustomerForReturns: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="require-customer">Require customer for returns</Label>
            </div>
            
            <div>
              <Label htmlFor="barcode-format">Barcode Format</Label>
              <Select
                id="barcode-format"
                value={settings.barcodeFormat}
                onChange={(e) => setSettings(prev => ({ ...prev, barcodeFormat: e.target.value }))}
              >
                <option value="UPC">UPC</option>
                <option value="EAN">EAN</option>
                <option value="CODE128">Code 128</option>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="default-payment">Default Payment Method</Label>
              <Select
                id="default-payment"
                value={settings.defaultPaymentMethod}
                onChange={(e) => setSettings(prev => ({ ...prev, defaultPaymentMethod: e.target.value }))}
              >
                <option value="CASH">Cash</option>
                <option value="CARD">Credit Card</option>
                <option value="MOBILE">Mobile Payment</option>
              </Select>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
