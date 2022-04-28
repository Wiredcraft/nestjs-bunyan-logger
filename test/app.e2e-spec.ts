import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './test-app/app.module';
import * as Logger from 'bunyan';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to track req,resp', async () => {
    const loggerMock = jest
      .spyOn(Logger.prototype, 'info')
      .mockImplementation();
    const resp = await request(app.getHttpServer())
      .get('/')
      .set('x-transaction-id', 'test-txn-id')
      .expect(200);
    expect(resp.text).toBe('hello');
    expect(loggerMock).toHaveBeenCalledTimes(2);
    // first call
    expect(loggerMock.mock.calls[0][0]).toHaveProperty('direction', 'inbound');
    expect(loggerMock.mock.calls[0][0]).toHaveProperty('route', '/');
    expect(loggerMock.mock.calls[0][0]).toHaveProperty(
      'transactionId',
      'test-txn-id',
    );
    // second call
    expect(loggerMock.mock.calls[1][0]).toHaveProperty('direction', 'outbound');
    expect(loggerMock.mock.calls[1][0]).toHaveProperty('route', '/');
    expect(loggerMock.mock.calls[1][0]).toHaveProperty(
      'transactionId',
      'test-txn-id',
    );
    loggerMock.mockRestore();
  });
  it('should skip record log for excludeReqPath', async () => {
    const loggerMock = jest
      .spyOn(Logger.prototype, 'info')
      .mockImplementation();
    // excludeReqPath is set in test-app/app.module.ts
    const resp = await request(app.getHttpServer()).get('/health').expect(200);
    expect(resp.text).toBe('ok');
    expect(loggerMock).toHaveBeenCalledTimes(0);
    loggerMock.mockRestore();
  });
  it('should be able to track resp when non-200 status code', async () => {
    const loggerInfoMock = jest
      .spyOn(Logger.prototype, 'info')
      .mockImplementation();
    const loggerErrorMock = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation();

    await request(app.getHttpServer()).get('/forbid').expect(403);
    expect(loggerInfoMock).toHaveBeenCalledTimes(1);
    expect(loggerErrorMock).toHaveBeenCalledTimes(1);
    expect(loggerInfoMock.mock.calls[0][0]).toHaveProperty(
      'direction',
      'inbound',
    );
    expect(loggerInfoMock.mock.calls[0][0]).toHaveProperty('route', '/forbid');
    expect(loggerErrorMock.mock.calls[0][0]).toHaveProperty(
      'direction',
      'outbound',
    );
    expect(loggerErrorMock.mock.calls[0][0]).toHaveProperty('route', '/forbid');
    expect(loggerErrorMock.mock.calls[0][0]).toHaveProperty('status-code', 403);
    expect(loggerErrorMock.mock.calls[0][0]).toHaveProperty('err');
    loggerInfoMock.mockRestore();
    loggerErrorMock.mockRestore();
  });
  it('should be able to record short-body', async () => {
    const loggerMock = jest
      .spyOn(Logger.prototype, 'info')
      .mockImplementation();
    const resp = await request(app.getHttpServer())
      .post('/cats')
      .set('x-transaction-id', 'test-txn-id')
      .send({ name: 'cathy', gene: 'Persian', age: 4 })
      .expect(201);
    expect(resp.body.data).toEqual({ name: 'cathy', gene: 'Persian', age: 4 });
    expect(loggerMock).toHaveBeenCalledTimes(2);
    // first call
    expect(loggerMock.mock.calls[0][0]).toHaveProperty('direction', 'inbound');
    expect(loggerMock.mock.calls[0][0]).toHaveProperty(
      'short-body',
      "{ name: 'cathy', gene: 'Persian', age: 4 }",
    );
    // second call
    expect(loggerMock.mock.calls[1][0]).toHaveProperty('direction', 'outbound');
    expect(loggerMock.mock.calls[1][0]).toHaveProperty(
      'short-body',
      "{ data: { name: 'cathy', gene: 'Persian', age: 4 } }",
    );

    loggerMock.mockRestore();
  });
});
