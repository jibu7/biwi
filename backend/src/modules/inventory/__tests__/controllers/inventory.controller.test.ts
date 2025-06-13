import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { createTestDataSource, cleanupTestDataSource, createTestUser } from '../../../../test/test-utils';
import { InventoryModule } from '../../inventory.module';
import { AuthModule } from '../../../auth/auth.module';
import { Company } from '../../../common/entities/company.entity';

describe('Inventory Controller E2E Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let company: Company;
  let warehouseId: string;
  let itemId: string;
  let uomId: string;

  beforeAll(async () => {
    dataSource = await createTestDataSource();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [InventoryModule, AuthModule],
    })
      .overrideProvider(DataSource)
      .useValue(dataSource)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create test company and user
    company = await dataSource.getRepository(Company).save({
      code: 'TEST',
      name: 'Test Company',
      baseCurrency: 'USD',
      active: true
    });

    const { user, token } = await createTestUser(app, dataSource, company, ['inventory.view', 'inventory.create', 'inventory.update']);
    authToken = token;
  });

  afterAll(async () => {
    await app.close();
    await cleanupTestDataSource(dataSource);
  });

  describe('Unit of Measure Endpoints', () => {
    it('POST /api/inventory/units-of-measure', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/inventory/units-of-measure')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: 'EA',
          name: 'Each',
          conversionFactor: 1
        });

      expect(response.status).toBe(201);
      expect(response.body.code).toBe('EA');
      uomId = response.body.id;
    });

    it('GET /api/inventory/units-of-measure', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/inventory/units-of-measure')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Warehouse Endpoints', () => {
    it('POST /api/inventory/warehouses', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/inventory/warehouses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: 'WH1',
          name: 'Main Warehouse',
          address: '123 Main St'
        });

      expect(response.status).toBe(201);
      expect(response.body.code).toBe('WH1');
      warehouseId = response.body.id;
    });

    it('GET /api/inventory/warehouses/:id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/inventory/warehouses/${warehouseId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('WH1');
    });
  });

  describe('Item Endpoints', () => {
    it('POST /api/inventory/items', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/inventory/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: 'ITEM001',
          name: 'Test Item',
          type: 'STOCK',
          baseUomId: uomId,
          costingMethod: 'WEIGHTED_AVERAGE',
          standardCost: 10.00
        });

      expect(response.status).toBe(201);
      expect(response.body.code).toBe('ITEM001');
      itemId = response.body.id;
    });

    it('PATCH /api/inventory/items/:id', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/inventory/items/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Test Item',
          standardCost: 12.00
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Test Item');
      expect(response.body.standardCost).toBe(12.00);
    });

    it('GET /api/inventory/items with filters', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/inventory/items')
        .query({ type: 'STOCK', active: true })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.every(item => item.type === 'STOCK')).toBe(true);
    });
  });

  describe('Transaction Endpoints', () => {
    it('POST /api/inventory/transactions/adjustment', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/inventory/transactions/adjustment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemId,
          warehouseId,
          quantity: 100,
          unitCost: 10.00,
          reasonCode: 'INITIAL',
          notes: 'Initial stock'
        });

      expect(response.status).toBe(201);
      expect(response.body.type).toBe('ADJUSTMENT');
      expect(response.body.quantity).toBe(100);
    });

    it('POST /api/inventory/transactions/transfer', async () => {
      // Create second warehouse
      const warehouse2Response = await request(app.getHttpServer())
        .post('/api/inventory/warehouses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: 'WH2',
          name: 'Secondary Warehouse'
        });

      const response = await request(app.getHttpServer())
        .post('/api/inventory/transactions/transfer')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemId,
          fromWarehouseId: warehouseId,
          toWarehouseId: warehouse2Response.body.id,
          quantity: 25,
          notes: 'Stock transfer'
        });

      expect(response.status).toBe(201);
      expect(response.body.outTransaction).toBeDefined();
      expect(response.body.inTransaction).toBeDefined();
    });

    it('GET /api/inventory/transactions', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/inventory/transactions')
        .query({ itemId, warehouseId })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Stock Level Endpoints', () => {
    it('GET /api/inventory/stock-levels', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/inventory/stock-levels')
        .query({ warehouseId })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data[0]).toHaveProperty('quantityOnHand');
      expect(response.body.data[0]).toHaveProperty('quantityAvailable');
    });

    it('GET /api/inventory/items/:id/availability', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/inventory/items/${itemId}/availability`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalOnHand');
      expect(response.body).toHaveProperty('totalAvailable');
      expect(response.body.warehouses).toBeInstanceOf(Array);
    });
  });

  describe('Physical Count Endpoints', () => {
    let countId: string;

    it('POST /api/inventory/counts', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/inventory/counts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          warehouseId,
          countDate: new Date().toISOString(),
          description: 'Monthly count'
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('DRAFT');
      countId = response.body.id;
    });

    it('POST /api/inventory/counts/:id/lines', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/inventory/counts/${countId}/lines`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          itemId,
          countedQuantity: 95,
          notes: 'Slight variance'
        });

      expect(response.status).toBe(201);
      expect(response.body.countedQuantity).toBe(95);
    });

    it('POST /api/inventory/counts/:id/complete', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/inventory/counts/${countId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('COMPLETED');
    });
  });

  describe('Reporting Endpoints', () => {
    it('GET /api/inventory/reports/valuation', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/inventory/reports/valuation')
        .query({ asOfDate: new Date().toISOString() })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalValue');
      expect(response.body.items).toBeInstanceOf(Array);
    });

    it('GET /api/inventory/reports/movement', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/inventory/reports/movement')
        .query({
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.items).toBeInstanceOf(Array);
    });
  });

  describe('Permission Tests', () => {
    let restrictedToken: string;

    beforeAll(async () => {
      const { token } = await createTestUser(app, dataSource, company, ['inventory.view']);
      restrictedToken = token;
    });

    it('should deny create without permission', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/inventory/items')
        .set('Authorization', `Bearer ${restrictedToken}`)
        .send({
          code: 'DENIED',
          name: 'Should not create'
        });

      expect(response.status).toBe(403);
    });

    it('should allow view with permission', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/inventory/items')
        .set('Authorization', `Bearer ${restrictedToken}`);

      expect(response.status).toBe(200);
    });
  });
});
