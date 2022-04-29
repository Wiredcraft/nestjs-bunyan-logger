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
  it('should be able to restrict the length of short-body', async () => {
    const loggerMock = jest
      .spyOn(Logger.prototype, 'info')
      .mockImplementation();
    const resp = await request(app.getHttpServer())
      .post('/cats')
      .set('x-transaction-id', 'test-txn-id')
      .send({
        name: '2022 - EP1',
        endorsers: [
          '7fda8f15-17ef-4e2a-8806-d7353f55173b',
          'e7e14470-dec0-49b6-b3e3-bb786ff2e708',
          '74981717-35d7-4b63-9665-5aa82c7a122d',
          'ed41b7ee-f0ea-43ec-9d2d-16aba915eb54',
          '562f1638-3979-4125-9ccd-68c69372fde0',
          '5fd629c3-d8b6-46c0-aa0b-34875b6760f0',
          '1e944742-fb12-4053-aa18-0bf99963aa93',
          '636e3981-042f-4f49-a9c3-b01b79178de2',
        ],
        startDate: '2022-03-29T08:50:00.963Z',
        endDate: '2022-04-30T03:55:05.999Z',
        terms:
          'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy text ever since the 1500s',
        createdAt: '2022-03-25T08:51:04.965Z',
        updatedAt: '2022-04-20T14:14:10.515Z',
        id: '9ce31e81-7ae6-4211-9e5a-7cfa25764764',
      })
      .expect(201);
    expect(loggerMock).toHaveBeenCalledTimes(2);
    // first call
    expect(loggerMock.mock.calls[0][0]).toHaveProperty('direction', 'inbound');
    expect(loggerMock.mock.calls[0][0]['short-body']).toHaveLength(100);
    // second call
    expect(loggerMock.mock.calls[1][0]).toHaveProperty('direction', 'outbound');
    expect(loggerMock.mock.calls[1][0]['short-body']).toHaveLength(100);

    loggerMock.mockRestore();
  });
});
