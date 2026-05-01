import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { WalletService } from '../src/modules/wallet/wallet.service';
import { StockService } from '../src/modules/stock/stock.service';
import { AuditLogService } from '../src/modules/audit-logs/audit-log.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('Stock Market API (e2e)', () => {
  let app: INestApplication;
  
  const mockWalletService = {
    buyStock: jest.fn(),
    sellStock: jest.fn(),
    getWalletStocks: jest.fn(),
    getWalletStockQuantity: jest.fn(),
  };

  const mockStockService = {
    setStocks: jest.fn(),
    getStocks: jest.fn(),
    getStock: jest.fn(),
  };

  const mockAuditLogService = {
    getAuditLogs: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(WalletService)
    .useValue(mockWalletService)
    .overrideProvider(StockService)
    .useValue(mockStockService)
    .overrideProvider(AuditLogService)
    .useValue(mockAuditLogService)
    .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Wallets API', () => {
    it('POST /wallets/:wallet_id/stocks/:stock_name - fails on invalid type (400)', async () => {
      return request(app.getHttpServer())
        .post('/wallets/w1/stocks/s1')
        .send({ type: 'invalid_type' })
        .expect(400); 
    });

    it('POST /wallets/:wallet_id/stocks/:stock_name - successful buy (200)', async () => {
      mockWalletService.buyStock.mockResolvedValue(undefined);

      return request(app.getHttpServer())
        .post('/wallets/w1/stocks/s1')
        .send({ type: 'buy' })
        .expect(200);
    });

    it('POST /wallets/:wallet_id/stocks/:stock_name - buy fails if stock missing (404)', async () => {
      mockWalletService.buyStock.mockRejectedValue(new NotFoundException());

      return request(app.getHttpServer())
        .post('/wallets/w1/stocks/missing_stock')
        .send({ type: 'buy' })
        .expect(404);
    });

    it('POST /wallets/:wallet_id/stocks/:stock_name - buy fails if stock empty (400)', async () => {
      mockWalletService.buyStock.mockRejectedValue(new BadRequestException());

      return request(app.getHttpServer())
        .post('/wallets/w1/stocks/empty_stock')
        .send({ type: 'buy' })
        .expect(400);
    });

    it('POST /wallets/:wallet_id/stocks/:stock_name - successful sell (200)', async () => {
      mockWalletService.sellStock.mockResolvedValue(undefined);

      return request(app.getHttpServer())
        .post('/wallets/w1/stocks/s1')
        .send({ type: 'sell' })
        .expect(200);
    });

    it('GET /wallets/:wallet_id - returns wallet state', async () => {
      mockWalletService.getWalletStocks.mockResolvedValue({
        id: 'w1',
        stocks: [{ name: 's1', quantity: 99 }]
      });

      return request(app.getHttpServer())
        .get('/wallets/w1')
        .expect(200)
        .expect({ id: 'w1', stocks: [{ name: 's1', quantity: 99 }] });
    });
  });

  describe('Stocks API', () => {
    it('GET /stocks - returns bank state', async () => {
      mockStockService.getStocks.mockResolvedValue([
        { name: 's1', quantity: 99 }
      ]);

      return request(app.getHttpServer())
        .get('/stocks')
        .expect(200)
        .expect({ stocks: [{ name: 's1', quantity: 99 }] });
    });

    it('POST /stocks - sets bank state (200)', async () => {
      mockStockService.setStocks.mockResolvedValue(undefined);

      return request(app.getHttpServer())
        .post('/stocks')
        .send({ stocks: [{ name: 's1', quantity: 99 }] })
        .expect(200);
    });
  });

  describe('Audit Log API', () => {
    it('GET /log - returns audit log', async () => {
      mockAuditLogService.getAuditLogs.mockResolvedValue([
        { type: 'buy', wallet_id: 'w1', stock_name: 's1' }
      ]);

      return request(app.getHttpServer())
        .get('/log')
        .expect(200)
        .expect({ log: [{ type: 'buy', wallet_id: 'w1', stock_name: 's1' }] });
    });
  });
});
