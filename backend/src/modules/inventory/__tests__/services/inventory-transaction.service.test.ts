import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { InventoryTransactionService } from '../../services/inventory-transaction.service';
import { InventoryTransaction } from '../../entities/inventory-transaction.entity';
import { Item } from '../../entities/item.entity';
import { Warehouse } from '../../entities/warehouse.entity';
import { Company } from '../../../common/entities/company.entity';
import { GLPostingService } from '../../../accounting/services/gl-posting.service';
import { createTestDataSource, cleanupTestDataSource } from '../../../../test/test-utils';

describe('Inventory Transaction Service Tests', () => {
  let module: TestingModule;
  let service: InventoryTransactionService;
  let dataSource: DataSource;
  let company: Company;
  let warehouse: Warehouse;
  let item: Item;
  let glPostingService: jest.Mocked<GLPostingService>;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    
    // Create mock GL posting service
    glPostingService = {
      createJournalEntry: jest.fn(),
      postInventoryTransaction: jest.fn()
    } as any;

    module = await Test.createTestingModule({
      providers: [
        InventoryTransactionService,
        {
          provide: DataSource,
          useValue: dataSource
        },
        {
          provide: GLPostingService,
          useValue: glPostingService
        }
      ]
    }).compile();

    service = module.get<InventoryTransactionService>(InventoryTransactionService);

    // Setup test data
    company = await dataSource.getRepository(Company).save({
      code: 'TEST',
      name: 'Test Company',
      baseCurrency: 'USD',
      active: true
    });

    warehouse = await dataSource.getRepository(Warehouse).save({
      company,
      code: 'WH1',
      name: 'Warehouse 1',
      active: true
    });

    const uom = await dataSource.getRepository('UnitOfMeasure').save({
      company,
      code: 'EA',
      name: 'Each',
      active: true
    });

    item = await dataSource.getRepository(Item).save({
      company,
      code: 'ITEM001',
      name: 'Test Item',
      type: 'STOCK',
      baseUom: uom,
      costingMethod: 'WEIGHTED_AVERAGE',
      standardCost: 10.00,
      active: true
    });
  });

  afterAll(async () => {
    await cleanupTestDataSource(dataSource);
    await module.close();
  });

  describe('processAdjustment', () => {
    it('should process positive adjustment', async () => {
      const adjustment = await service.processAdjustment({
        company,
        item,
        warehouse,
        quantity: 50,
        unitCost: 10.00,
        reasonCode: 'FOUND',
        notes: 'Found extra stock'
      });

      expect(adjustment).toBeDefined();
      expect(adjustment.type).toBe('ADJUSTMENT');
      expect(adjustment.quantity).toBe(50);
      expect(adjustment.unitCost).toBe(10.00);
      expect(adjustment.totalCost).toBe(500.00);
      expect(glPostingService.postInventoryTransaction).toHaveBeenCalled();
    });

    it('should process negative adjustment', async () => {
      const adjustment = await service.processAdjustment({
        company,
        item,
        warehouse,
        quantity: -20,
        unitCost: 10.00,
        reasonCode: 'DAMAGED',
        notes: 'Damaged goods'
      });

      expect(adjustment.quantity).toBe(-20);
      expect(adjustment.totalCost).toBe(-200.00);
    });

    it('should update item warehouse quantities', async () => {
      const itemWarehouse = await dataSource.getRepository('ItemWarehouse').save({
        item,
        warehouse,
        quantityOnHand: 100,
        quantityReserved: 0
      });

      await service.processAdjustment({
        company,
        item,
        warehouse,
        quantity: 25,
        unitCost: 10.00,
        reasonCode: 'FOUND'
      });

      const updated = await dataSource.getRepository('ItemWarehouse')
        .findOne({ where: { id: itemWarehouse.id } });
      
      expect(updated.quantityOnHand).toBe(125);
    });
  });

  describe('processTransfer', () => {
    let warehouse2: Warehouse;

    beforeEach(async () => {
      warehouse2 = await dataSource.getRepository(Warehouse).save({
        company,
        code: 'WH2',
        name: 'Warehouse 2',
        active: true
      });

      // Setup initial stock
      await dataSource.getRepository('ItemWarehouse').save({
        item,
        warehouse,
        quantityOnHand: 100,
        quantityReserved: 0
      });

      await dataSource.getRepository('ItemWarehouse').save({
        item,
        warehouse: warehouse2,
        quantityOnHand: 0,
        quantityReserved: 0
      });
    });

    it('should process warehouse transfer', async () => {
      const result = await service.processTransfer({
        company,
        item,
        fromWarehouse: warehouse,
        toWarehouse: warehouse2,
        quantity: 30,
        notes: 'Stock rebalancing'
      });

      expect(result.outTransaction).toBeDefined();
      expect(result.inTransaction).toBeDefined();
      expect(result.outTransaction.quantity).toBe(-30);
      expect(result.inTransaction.quantity).toBe(30);
    });

    it('should update warehouse quantities', async () => {
      await service.processTransfer({
        company,
        item,
        fromWarehouse: warehouse,
        toWarehouse: warehouse2,
        quantity: 40
      });

      const fromWarehouseItem = await dataSource.getRepository('ItemWarehouse')
        .findOne({ where: { item: { id: item.id }, warehouse: { id: warehouse.id } } });
      
      const toWarehouseItem = await dataSource.getRepository('ItemWarehouse')
        .findOne({ where: { item: { id: item.id }, warehouse: { id: warehouse2.id } } });
      
      expect(fromWarehouseItem.quantityOnHand).toBe(60);
      expect(toWarehouseItem.quantityOnHand).toBe(40);
    });

    it('should prevent transfer of insufficient stock', async () => {
      await expect(
        service.processTransfer({
          company,
          item,
          fromWarehouse: warehouse,
          toWarehouse: warehouse2,
          quantity: 150 // More than available
        })
      ).rejects.toThrow('Insufficient stock');
    });
  });

  describe('Weighted Average Costing', () => {
    it('should calculate weighted average cost correctly', async () => {
      // Initial stock: 100 @ $10
      await dataSource.getRepository('ItemWarehouse').save({
        item,
        warehouse,
        quantityOnHand: 100,
        quantityReserved: 0,
        weightedAverageCost: 10.00
      });

      // Add 50 @ $12
      await service.processAdjustment({
        company,
        item,
        warehouse,
        quantity: 50,
        unitCost: 12.00,
        reasonCode: 'PURCHASE'
      });

      const itemWarehouse = await dataSource.getRepository('ItemWarehouse')
        .findOne({ where: { item: { id: item.id }, warehouse: { id: warehouse.id } } });
      
      // New weighted average: (100*10 + 50*12) / 150 = 10.67
      expect(itemWarehouse.weightedAverageCost).toBeCloseTo(10.67, 2);
    });
  });
});
