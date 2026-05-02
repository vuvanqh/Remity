import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { db } from '../src/database/kysely.provider';

describe('Stock Market (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  beforeEach(async () => {
    await db.deleteFrom('auditLogs').execute();
    await db.deleteFrom('walletStocks').execute();
    await db.deleteFrom('wallets').execute();
    await db.deleteFrom('stocks').execute();
  });

  afterAll(async () => {
    await app.close();  
  });

  it('GET /health', async () => {
    await request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('POST /stocks + GET /stocks', async () => {
    await request(app.getHttpServer())
      .post('/stocks')
      .send({
        stocks: [
          { name: 's1', quantity: 10 },
          { name: 's2', quantity: 5 },
        ],
      })
      .expect(200);

    const res = await request(app.getHttpServer()).get('/stocks').expect(200);

    expect(res.body.stocks).toEqual(
      expect.arrayContaining([
        { name: 's1', quantity: 10 },
        { name: 's2', quantity: 5 },
      ]),
    );
  });

  it('BUY flow creates wallet and updates bank', async () => {
    await request(app.getHttpServer())
      .post('/stocks')
      .send({ stocks: [{ name: 's1', quantity: 2 }] });

    await request(app.getHttpServer())
      .post('/wallets/w1/stocks/s1')
      .send({ type: 'buy' })
      .expect(200);

    const wallet = await request(app.getHttpServer())
      .get('/wallets/w1')
      .expect(200);

    expect(wallet.body).toEqual({
      id: 'w1',
      stocks: [{ name: 's1', quantity: 1 }],
    });

    const stocks = await request(app.getHttpServer()).get('/stocks');

    expect(stocks.body.stocks).toContainEqual({
      name: 's1',
      quantity: 1,
    });
  });

  it('BUY fails if stock does not exist (404)', async () => {
    await request(app.getHttpServer())
      .post('/wallets/w1/stocks/unknown')
      .send({ type: 'buy' })
      .expect(404);
  });

  it('BUY fails if stock empty (400)', async () => {
    await request(app.getHttpServer())
      .post('/stocks')
      .send({ stocks: [{ name: 's1', quantity: 0 }] });

    await request(app.getHttpServer())
      .post('/wallets/w1/stocks/s1')
      .send({ type: 'buy' })
      .expect(400);
  });

  it('SELL decreases wallet and increases bank', async () => {
    await request(app.getHttpServer())
      .post('/stocks')
      .send({ stocks: [{ name: 's1', quantity: 1 }] });

    await request(app.getHttpServer())
      .post('/wallets/w1/stocks/s1')
      .send({ type: 'buy' });

    await request(app.getHttpServer())
      .post('/wallets/w1/stocks/s1')
      .send({ type: 'sell' })
      .expect(200);

    const wallet = await request(app.getHttpServer()).get('/wallets/w1');

    expect(wallet.body.stocks[0].quantity).toBe(0);

    const stocks = await request(app.getHttpServer()).get('/stocks');

    expect(stocks.body.stocks[0].quantity).toBe(1);
  });

  it('SELL fails if wallet has no stock (400)', async () => {
    await request(app.getHttpServer())
      .post('/stocks')
      .send({ stocks: [{ name: 's1', quantity: 10 }] });

    await request(app.getHttpServer())
      .post('/wallets/w1/stocks/s1')
      .send({ type: 'sell' })
      .expect(400);
  });

  it('GET wallet stock quantity', async () => {
    await request(app.getHttpServer())
      .post('/stocks')
      .send({ stocks: [{ name: 's1', quantity: 5 }] });

    await request(app.getHttpServer())
      .post('/wallets/w1/stocks/s1')
      .send({ type: 'buy' });

    const res = await request(app.getHttpServer())
      .get('/wallets/w1/stocks/s1')
      .expect(200);

    expect(Number(res.text)).toBe(1);
  });

  it('GET /log returns only successful operations in order', async () => {
    await request(app.getHttpServer())
      .post('/stocks')
      .send({ stocks: [{ name: 's1', quantity: 2 }] });

    await request(app.getHttpServer())
      .post('/wallets/w1/stocks/s1')
      .send({ type: 'buy' });

    await request(app.getHttpServer())
      .post('/wallets/w1/stocks/s1')
      .send({ type: 'sell' });

    const res = await request(app.getHttpServer()).get('/log').expect(200);

    expect(res.body.log).toEqual([
      { type: 'buy', wallet_id: 'w1', stock_name: 's1' },
      { type: 'sell', wallet_id: 'w1', stock_name: 's1' },
    ]);
  });
  it('high concurrency: never oversells and preserves invariants', async () => {
    const STOCK = 's1';
    const INITIAL = 10;
    const REQUESTS = 50;

    await request(app.getHttpServer())
      .post('/stocks')
      .send({ stocks: [{ name: STOCK, quantity: INITIAL }] })
      .expect(200);

    const responses = await Promise.allSettled(
      Array.from({ length: REQUESTS }).map(() =>
        request(app.getHttpServer())
          .post(`/wallets/w1/stocks/${STOCK}`)
          .send({ type: 'buy' }),
      ),
    );

    const successCount = responses.filter(
      (r) => r.status === 'fulfilled' && r.value.status === 200,
    ).length;

    const failureCount = responses.length - successCount;

    expect(successCount).toBe(INITIAL);
    expect(failureCount).toBeGreaterThan(0);

    const bank = await request(app.getHttpServer()).get('/stocks').expect(200);

    const stock = bank.body.stocks.find((s: any) => s.name === STOCK);
    expect(stock.quantity).toBe(0);

    const wallet = await request(app.getHttpServer())
      .get('/wallets/w1')
      .expect(200);

    const walletStock = wallet.body.stocks.find((s: any) => s.name === STOCK);
    expect(walletStock.quantity).toBe(INITIAL);

    const log = await request(app.getHttpServer()).get('/log').expect(200);

    const buys = log.body.log.filter((l: any) => l.type === 'buy');
    expect(buys.length).toBe(INITIAL);
  });
});
