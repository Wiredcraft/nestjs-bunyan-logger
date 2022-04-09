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

  it('should be able to track req,resp', async () => {
    const loggerMock = jest
      .spyOn(Logger.prototype, 'info')
      .mockImplementation();
    const resp = await request(app.getHttpServer()).get('/').expect(200);
    expect(resp.status).toBe(200);
    expect(resp.text).toBe('hello');
    expect(loggerMock).toHaveBeenCalledTimes(2);
    // first call
    expect(loggerMock.mock.calls[0][0]).toHaveProperty('direction', 'inbound');
    expect(loggerMock.mock.calls[0][0]).toHaveProperty('route', '/');
    // second call
    expect(loggerMock.mock.calls[1][0]).toHaveProperty('direction', 'outbound');
    expect(loggerMock.mock.calls[1][0]).toHaveProperty('route', '/');
    loggerMock.mockRestore();
  });
  it('should skip record log for excludeReqPath', async () => {
    const loggerMock = jest
      .spyOn(Logger.prototype, 'info')
      .mockImplementation();
    // excludeReqPath is set in test-app/app.module.ts
    const resp = await request(app.getHttpServer()).get('/health').expect(200);
    expect(resp.status).toBe(200);
    expect(resp.text).toBe('ok');
    expect(loggerMock).toHaveBeenCalledTimes(0);
    loggerMock.mockRestore();
  });
});
