import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { db } from '../src/database/kysely.provider';

describe('Stock Market API (e2e) - Real Database', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // This will connect to the real database configured in .env (or localhost:1433)
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    // Close Kysely DB connection
    await db.destroy();
  });

  beforeEach(async () => {
    // Teardown: Wipe all tables before each test to guarantee isolation
    await db.deleteFrom('auditLogs').execute();
    await db.deleteFrom('walletStocks').execute();
    await db.deleteFrom('wallets').execute();
    await db.deleteFrom('stocks').execute();
  });

  describe('Wallets API', () => {
    it('POST /wallets/:wallet_id/stocks/:stock_name - fails on invalid type (400)', async () => {
      return request(app.getHttpServer())
        .post('/wallets/w1/stocks/s1')
        .send({ type: 'invalid_type' })
        .expect(400); // ValidationPipe should block this
    });

    it('POST /wallets/:wallet_id/stocks/:stock_name - successful buy (200) and creates wallet', async () => {
      // Seed bank with 10 stock1
      await db.insertInto('stocks').values({ name: 's1', quantity: 10 }).execute();

      await request(app.getHttpServer())
        .post('/wallets/w1/stocks/s1')
        .send({ type: 'buy' })
        .expect(200);

      // Verify wallet stock
      const walletStock = await db.selectFrom('walletStocks').selectAll().executeTakeFirst();
      expect(walletStock?.wallet_id).toBe('w1');
      expect(walletStock?.stock_name).toBe('s1');
      expect(walletStock?.quantity).toBe(1);

      // Verify bank stock
      const bankStock = await db.selectFrom('stocks').selectAll().where('name', '=', 's1').executeTakeFirst();
      expect(bankStock?.quantity).toBe(9);

      // Verify audit log
      const log = await db.selectFrom('auditLogs').selectAll().executeTakeFirst();
      expect(log?.type).toBe('buy');
    });

    it('POST /wallets/:wallet_id/stocks/:stock_name - buy fails if stock missing (404)', async () => {
      return request(app.getHttpServer())
        .post('/wallets/w1/stocks/missing_stock')
        .send({ type: 'buy' })
        .expect(404);
    });

    it('POST /wallets/:wallet_id/stocks/:stock_name - buy fails if stock empty (400)', async () => {
      // Seed bank with 0 stock1
      await db.insertInto('stocks').values({ name: 's1', quantity: 0 }).execute();

      return request(app.getHttpServer())
        .post('/wallets/w1/stocks/s1')
        .send({ type: 'buy' })
        .expect(400);
    });

    it('POST /wallets/:wallet_id/stocks/:stock_name - successful sell (200)', async () => {
      // Seed bank and wallet
      await db.insertInto('stocks').values({ name: 's1', quantity: 5 }).execute();
      await db.insertInto('wallets').values({ id: 'w1' }).execute();
      await db.insertInto('walletStocks').values({ wallet_id: 'w1', stock_name: 's1', quantity: 2 }).execute();

      await request(app.getHttpServer())
        .post('/wallets/w1/stocks/s1')
        .send({ type: 'sell' })
        .expect(200);

      // Verify wallet stock decremented
      const walletStock = await db.selectFrom('walletStocks').selectAll().executeTakeFirst();
      expect(walletStock?.quantity).toBe(1);

      // Verify bank stock incremented
      const bankStock = await db.selectFrom('stocks').selectAll().executeTakeFirst();
      expect(bankStock?.quantity).toBe(6);
      
      // Verify audit log
      const log = await db.selectFrom('auditLogs').selectAll().executeTakeFirst();
      expect(log?.type).toBe('sell');
    });

    it('GET /wallets/:wallet_id - returns wallet state', async () => {
      await db.insertInto('wallets').values({ id: 'w1' }).execute();
      await db.insertInto('walletStocks').values({ wallet_id: 'w1', stock_name: 's1', quantity: 99 }).execute();

      const res = await request(app.getHttpServer())
        .get('/wallets/w1')
        .expect(200);

      expect(res.body).toEqual({ id: 'w1', stocks: [{ name: 's1', quantity: 99 }] });
    });
  });

  describe('Concurrency & Race Conditions', () => {
    it('should only allow 1 buy when bank has exactly 1 stock available under load', async () => {
      // Setup: Bank has exactly 1 unit of stock1
      await db.insertInto('stocks').values({ name: 's1', quantity: 1 }).execute();

      // Fire 10 simultaneous requests to buy that single stock
      const requests = Array.from({ length: 10 }).map(() =>
        request(app.getHttpServer())
          .post('/wallets/w1/stocks/s1')
          .send({ type: 'buy' })
      );

      const responses = await Promise.all(requests);

      // Exactly 1 request should succeed (200), and 9 should fail (400)
      const successCount = responses.filter((r) => r.status === 200).length;
      const failCount = responses.filter((r) => r.status === 400).length;

      expect(successCount).toBe(1);
      expect(failCount).toBe(9);

      // Verify bank has 0 stock
      const bankStock = await db.selectFrom('stocks').selectAll().executeTakeFirst();
      expect(bankStock?.quantity).toBe(0);

      // Verify wallet has exactly 1 stock
      const walletStock = await db.selectFrom('walletStocks').selectAll().executeTakeFirst();
      expect(walletStock?.quantity).toBe(1);

      // Verify audit log only logged 1 successful buy
      const logs = await db.selectFrom('auditLogs').selectAll().execute();
      expect(logs.length).toBe(1);
    });
  });

  describe('Stocks API', () => {
    it('GET /stocks - returns bank state', async () => {
      await db.insertInto('stocks').values({ name: 's1', quantity: 99 }).execute();

      const res = await request(app.getHttpServer())
        .get('/stocks')
        .expect(200);

      expect(res.body).toEqual({ stocks: [{ name: 's1', quantity: 99 }] });
    });

    it('POST /stocks - sets bank state (200)', async () => {
      await request(app.getHttpServer())
        .post('/stocks')
        .send({ stocks: [{ name: 's1', quantity: 99 }] })
        .expect(200);

      const bankStock = await db.selectFrom('stocks').selectAll().executeTakeFirst();
      expect(bankStock?.name).toBe('s1');
      expect(bankStock?.quantity).toBe(99);
    });
  });

  describe('Audit Log API', () => {
    it('GET /log - returns audit log', async () => {
      await db.insertInto('auditLogs').values({ type: 'buy', wallet_id: 'w1', stock_name: 's1' }).execute();

      const res = await request(app.getHttpServer())
        .get('/log')
        .expect(200);
      
      expect(res.body.log[0]).toMatchObject({ type: 'buy', wallet_id: 'w1', stock_name: 's1' });
    });
  });
});
