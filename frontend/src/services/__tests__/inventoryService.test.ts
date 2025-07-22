/**
 * @jest-environment jsdom
 */


import { inventoryService } from '@/services/inventoryService';
import * as axiosInstance from '@/lib/axiosInstance';

jest.mock('@/lib/axiosInstance');

describe('InventoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(inventoryService).toBeDefined()
  })

  it('should have getInventoryItems method', () => {
    expect(typeof inventoryService.getInventoryItems).toBe('function')
  })

  it('should have createInventoryItem method', () => {
    expect(typeof inventoryService.createInventoryItem).toBe('function')
  })

  it('should have processAdjustment method', () => {
    expect(typeof inventoryService.processAdjustment).toBe('function')
  })

  describe('getInventoryItems', () => {
    it('should fetch items with correct endpoint and default parameters', async () => {
      const mockAxios = axiosInstance as jest.Mocked<any>;
      const mockItems = [
        { id: 1, code: 'ITEM001', description: 'Test Item 1' },
        { id: 2, code: 'ITEM002', description: 'Test Item 2' }
      ]
      mockAxios.get.mockResolvedValue({ data: mockItems })

      const result = await inventoryService.getInventoryItems()

      expect(mockAxios.get).toHaveBeenCalledWith('/inventory/items', {
        params: { skip: 0, limit: 100 }
      })
      expect(result).toEqual(mockItems)
    })

    it('should handle custom skip and limit parameters', async () => {
      const mockAxios = require('@/lib/axiosInstance')
      mockAxios.get.mockResolvedValue({ data: [] })

      await inventoryService.getInventoryItems(20, 50)

      expect(mockAxios.get).toHaveBeenCalledWith('/inventory/items', {
        params: { skip: 20, limit: 50 }
      })
    })
  })

  describe('createInventoryItem', () => {
    it('should create item with correct data', async () => {
      const mockAxios = require('@/lib/axiosInstance')
      const newItem = {
        item_code: 'NEW001',
        description: 'New Test Item',
        item_type: "Stock" as const,
        unit_of_measure_id: 1
      };
      const createdItem = { id: 3, ...newItem };
      mockAxios.post.mockResolvedValue({ data: createdItem });
      const result = await inventoryService.createInventoryItem(newItem);
      expect(mockAxios.post).toHaveBeenCalledWith('/inventory/items', newItem);
      expect(result).toEqual(createdItem);
    })
  })

  describe('processAdjustment', () => {
    it('should process adjustment with correct data', async () => {
      const mockAxios = require('@/lib/axiosInstance')
      const adjustmentData = {
        item_id: 1,
        warehouse_id: 1,
        quantity: 10,
        reason: 'Initial stock',
        inventory_transaction_type_id: 1
      };
      const processedAdjustment = { id: 1, ...adjustmentData };
      mockAxios.post.mockResolvedValue({ data: processedAdjustment });
      const result = await inventoryService.processAdjustment(adjustmentData);
      expect(mockAxios.post).toHaveBeenCalledWith('/inventory/adjustments', adjustmentData);
      expect(result).toEqual(processedAdjustment);

    });
  });
});
