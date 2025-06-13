import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { InventoryTransactionService } from '../../services/inventory-transaction.service';
import { GLPostingService } from '../../../accounting/services/gl-posting.service';
import { GLAccount } from '../../../accounting/entities/gl-account.entity';
import { JournalEntry } from '../../../accounting/entities/journal-entry.entity';
import { createTestDataSource, cleanupTestDataSource } from '../../../../test/test-utils';
import { Company } from '../../../common/entities/company.entity';

describe('Inventory GL Posting Integration Tests', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let inventoryService: InventoryTransactionService;
  let glPostingService: GLPostingService;
  let company: Company;
  let inventoryAccount: GLAccount;
  let cogsAccount: GLAccount;
  let adjustmentAccount: GLAccount;

  beforeAll(async () => {
    dataSource = await createTestDataSource();

    module = await Test.createTestingModule({
      providers: [
        InventoryTransactionService,
        GLPostingService,
        {
          provide: DataSource,
          useValue: dataSource
        }
      ]
    }).compile();

    inventoryService = module.get<InventoryTransactionService>(InventoryTransactionService);
    glPostingService = module.get<GLPostingService>(GLPostingService);

    // Setup test data
    company = await dataSource.getRepository(Company).save({
      code: 'TEST',
      name: 'Test Company',
      baseCurrency: 'USD',
      active: true
    });

    // Create GL accounts
    inventoryAccount = await dataSource.getRepository(GLAccount).save({
      company,
      code: '1400',
      name: 'Inventory',
      type: 'ASSET',
      normalBalance: 'DEBIT',
      active: true
    });

    cogsAccount = await dataSource.getRepository(GLAccount).save({
      company,
      code: '5000',
      name: 'Cost of Goods Sold',
      type: 'EXPENSE',
      normalBalance: 'DEBIT',
      active: true
    });

    adjustmentAccount = await dataSource.getRepository(GLAccount).save({
      company,
      code: '5900',
      name: 'Inventory Adjustments',
      type: 'EXPENSE',
      normalBalance: 'DEBIT',
      active: true
    });

    // Update company with GL accounts
    await dataSource.getRepository(Company).update(company.id, {
      inventoryAccount,
      cogsAccount,
      inventoryAdjustmentAccount: adjustmentAccount
    });
  });

  afterAll(async () => {
    await cleanupTestDataSource(dataSource);
    await module.close();
  });

  describe('Adjustment GL Posting', () => {
    it('should post positive adjustment to GL', async () => {
      // Create warehouse and item
      const warehouse = await dataSource.getRepository('Warehouse').save({
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

      const item = await dataSource.getRepository('Item').save({
        company,
        code: 'ITEM001',
        name: 'Test Item',
        type: 'STOCK',
        baseUom: uom,
        costingMethod: 'WEIGHTED_AVERAGE',
        active: true
      });

      // Process adjustment
      const adjustment = await inventoryService.processAdjustment({
        company,
        item,
        warehouse,
        quantity: 50,
        unitCost: 10.00,
        reasonCode: 'FOUND',
        notes: 'Found stock'
      });

      // Verify journal entry was created
      const journalEntries = await dataSource.getRepository(JournalEntry)
        .find({
          where: { 
            reference: adjustment.transactionNumber,
            company: { id: company.id }
          },
          relations: ['lines', 'lines.account']
        });

      expect(journalEntries).toHaveLength(1);
      const entry = journalEntries[0];
      expect(entry.lines).toHaveLength(2);

      // Verify debit to inventory
      const inventoryLine = entry.lines.find(l => l.account.id === inventoryAccount.id);
      expect(inventoryLine).toBeDefined();
      expect(inventoryLine.debitAmount).toBe(500.00);
      expect(inventoryLine.creditAmount).toBe(0);

      // Verify credit to adjustment account
      const adjustmentLine = entry.lines.find(l => l.account.id === adjustmentAccount.id);
      expect(adjustmentLine).toBeDefined();
      expect(adjustmentLine.creditAmount).toBe(500.00);
      expect(adjustmentLine.debitAmount).toBe(0);
    });

    it('should post negative adjustment to GL', async () => {
      const warehouse = await dataSource.getRepository('Warehouse').findOne({
        where: { code: 'WH1', company: { id: company.id } }
      });

      const item = await dataSource.getRepository('Item').findOne({
        where: { code: 'ITEM001', company: { id: company.id } },
        relations: ['baseUom']
      });

      // Process negative adjustment
      const adjustment = await inventoryService.processAdjustment({
        company,
        item,
        warehouse,
        quantity: -10,
        unitCost: 10.00,
        reasonCode: 'DAMAGED',
        notes: 'Damaged goods'
      });

      // Verify journal entry
      const journalEntries = await dataSource.getRepository(JournalEntry)
        .find({
          where: { 
            reference: adjustment.transactionNumber,
            company: { id: company.id }
          },
          relations: ['lines', 'lines.account']
        });

      expect(journalEntries).toHaveLength(1);
      const entry = journalEntries[0];

      // Verify credit to inventory
      const inventoryLine = entry.lines.find(l => l.account.id === inventoryAccount.id);
      expect(inventoryLine.creditAmount).toBe(100.00);

      // Verify debit to adjustment account
      const adjustmentLine = entry.lines.find(l => l.account.id === adjustmentAccount.id);
      expect(adjustmentLine.debitAmount).toBe(100.00);
    });
  });

  describe('Transfer GL Posting', () => {
    it('should not create GL entries for transfers', async () => {
      // Transfers between warehouses don't affect GL (same company)
      const warehouse1 = await dataSource.getRepository('Warehouse').findOne({
        where: { code: 'WH1', company: { id: company.id } }
      });

      const warehouse2 = await dataSource.getRepository('Warehouse').save({
        company,
        code: 'WH2',
        name: 'Warehouse 2',
        active: true
      });

      const item = await dataSource.getRepository('Item').findOne({
        where: { code: 'ITEM001', company: { id: company.id } },
        relations: ['baseUom']
      });

      const beforeCount = await dataSource.getRepository(JournalEntry).count();

      await inventoryService.processTransfer({
        company,
        item,
        fromWarehouse: warehouse1,
        toWarehouse: warehouse2,
        quantity: 5
      });

      const afterCount = await dataSource.getRepository(JournalEntry).count();
      expect(afterCount).toBe(beforeCount); // No new journal entries
    });
  });

  describe('Physical Count GL Posting', () => {
    it('should post count variances to GL', async () => {
      const warehouse = await dataSource.getRepository('Warehouse').findOne({
        where: { code: 'WH1', company: { id: company.id } }
      });

      const item = await dataSource.getRepository('Item').findOne({
        where: { code: 'ITEM001', company: { id: company.id } },
        relations: ['baseUom']
      });

      // Current quantity should be 40 (50 - 10 from previous tests)
      const itemWarehouse = await dataSource.getRepository('ItemWarehouse').findOne({
        where: { 
          item: { id: item.id }, 
          warehouse: { id: warehouse.id } 
        }
      });

      const currentQty = itemWarehouse.quantityOnHand;

      // Process count with variance
      const countedQty = currentQty - 5; // Short by 5
      const variance = await inventoryService.processCountVariance({
        company,
        item,
        warehouse,
        systemQuantity: currentQty,
        countedQuantity: countedQty,
        notes: 'Physical count variance'
      });

      // Verify GL posting for variance
      const journalEntries = await dataSource.getRepository(JournalEntry)
        .find({
          where: { 
            reference: variance.transactionNumber,
            company: { id: company.id }
          },
          relations: ['lines', 'lines.account']
        });

      expect(journalEntries).toHaveLength(1);
      
      // Should credit inventory and debit adjustment account for shortage
      const inventoryLine = journalEntries[0].lines
        .find(l => l.account.id === inventoryAccount.id);
      expect(inventoryLine.creditAmount).toBeGreaterThan(0);
    });
  });
});
