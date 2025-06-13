import { DataSource } from 'typeorm';
import { createTestDataSource, cleanupTestDataSource } from '../../../../test/test-utils';
import { Item } from '../../entities/item.entity';
import { ItemWarehouse } from '../../entities/item-warehouse.entity';
import { Warehouse } from '../../entities/warehouse.entity';
import { UnitOfMeasure } from '../../entities/unit-of-measure.entity';
import { Company } from '../../../common/entities/company.entity';

describe('Item Model Tests', () => {
  let dataSource: DataSource;
  let company: Company;
  let warehouse: Warehouse;
  let uom: UnitOfMeasure;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    
    // Create test company
    company = await dataSource.getRepository(Company).save({
      code: 'TEST',
      name: 'Test Company',
      baseCurrency: 'USD',
      active: true
    });

    // Create test UoM
    uom = await dataSource.getRepository(UnitOfMeasure).save({
      company,
      code: 'EA',
      name: 'Each',
      active: true
    });

    // Create test warehouse
    warehouse = await dataSource.getRepository(Warehouse).save({
      company,
      code: 'WH1',
      name: 'Warehouse 1',
      active: true
    });
  });

  afterAll(async () => {
    await cleanupTestDataSource(dataSource);
  });

  describe('Item Creation', () => {
    it('should create an item with valid data', async () => {
      const item = await dataSource.getRepository(Item).save({
        company,
        code: 'ITEM001',
        name: 'Test Item',
        type: 'STOCK',
        baseUom: uom,
        costingMethod: 'WEIGHTED_AVERAGE',
        active: true
      });

      expect(item.id).toBeDefined();
      expect(item.code).toBe('ITEM001');
      expect(item.type).toBe('STOCK');
    });

    it('should enforce unique item code per company', async () => {
      await dataSource.getRepository(Item).save({
        company,
        code: 'UNIQUE001',
        name: 'First Item',
        type: 'STOCK',
        baseUom: uom,
        active: true
      });

      await expect(
        dataSource.getRepository(Item).save({
          company,
          code: 'UNIQUE001',
          name: 'Duplicate Item',
          type: 'STOCK',
          baseUom: uom,
          active: true
        })
      ).rejects.toThrow();
    });
  });

  describe('Item-Warehouse Relationship', () => {
    it('should create item-warehouse records', async () => {
      const item = await dataSource.getRepository(Item).save({
        company,
        code: 'ITEM002',
        name: 'Warehouse Test Item',
        type: 'STOCK',
        baseUom: uom,
        active: true
      });

      const itemWarehouse = await dataSource.getRepository(ItemWarehouse).save({
        item,
        warehouse,
        quantityOnHand: 100,
        quantityReserved: 10,
        reorderPoint: 20,
        reorderQuantity: 50
      });

      expect(itemWarehouse.quantityAvailable).toBe(90);
      expect(itemWarehouse.quantityOnHand).toBe(100);
    });

    it('should calculate available quantity correctly', async () => {
      const item = await dataSource.getRepository(Item).save({
        company,
        code: 'ITEM003',
        name: 'Availability Test Item',
        type: 'STOCK',
        baseUom: uom,
        active: true
      });

      const itemWarehouse = await dataSource.getRepository(ItemWarehouse).save({
        item,
        warehouse,
        quantityOnHand: 50,
        quantityReserved: 30
      });

      expect(itemWarehouse.quantityAvailable).toBe(20);
    });
  });
});
