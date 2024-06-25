import { Test } from '@nestjs/testing';
import Bunyan from 'bunyan';
import { LoggerConfig, LoggerModule } from '../src';
import { LOGGER } from '../src/constants';

describe('Logger Provider', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('transforms', () => {
    describe('reducer', () => {
      it('should copy constant value to the log entry', async () => {
        const customField = 'custom-value';
        const spy = jest
          .spyOn(Bunyan.prototype as any, '_emit')
          .mockImplementation();

        const options: LoggerConfig = {
          name: 'test-app',
          streamType: 'STDOUT',
          transformers: [{ constant: { customField } }],
        };

        const moduleRef = await Test.createTestingModule({
          imports: [LoggerModule.forRoot(options)],
        }).compile();

        const logger = moduleRef.get<Bunyan>(LOGGER);
        logger.info({ transactionId: 'test-transaction-id' });

        expect(spy.mock.calls[0][0]).toHaveProperty('customField', customField);
      });

      it('should copy value from original field to the specified field without deleting original field', async () => {
        const customField = 'custom-value';
        const spy = jest
          .spyOn(Bunyan.prototype as any, '_emit')
          .mockImplementation();

        const options: LoggerConfig = {
          name: 'test-app',
          streamType: 'STDOUT',
          transformers: [{ clone: { customField: 'newField' } }],
        };

        const moduleRef = await Test.createTestingModule({
          imports: [LoggerModule.forRoot(options)],
        }).compile();

        const logger = moduleRef.get<Bunyan>(LOGGER);
        logger.info({ customField });

        expect(spy.mock.calls[0][0]).toHaveProperty('customField', customField);
        expect(spy.mock.calls[0][0]).toHaveProperty('newField', customField);
      });

      it('should support 1 level embedded field name specificatio when transform type is clone', async () => {
        const customField = 'custom-value';
        const spy = jest
          .spyOn(Bunyan.prototype as any, '_emit')
          .mockImplementation();

        const options: LoggerConfig = {
          name: 'test-app',
          streamType: 'STDOUT',
          transformers: [{ clone: { customField: 'newParent.newField' } }],
        };

        const moduleRef = await Test.createTestingModule({
          imports: [LoggerModule.forRoot(options)],
        }).compile();

        const logger = moduleRef.get<Bunyan>(LOGGER);
        logger.info({ customField });

        expect(spy.mock.calls[0][0]).toHaveProperty('customField', customField);
        expect(spy.mock.calls[0][0]).toHaveProperty(
          'newParent.newField',
          customField,
        );
      });

      it('should ignore the remaining embedded field name specification', async () => {
        const customField = 'custom-value';
        const spy = jest
          .spyOn(Bunyan.prototype as any, '_emit')
          .mockImplementation();

        const options: LoggerConfig = {
          name: 'test-app',
          streamType: 'STDOUT',
          transformers: [
            { clone: { customField: 'newParent.newSecondParent.newField' } },
          ],
        };

        const moduleRef = await Test.createTestingModule({
          imports: [LoggerModule.forRoot(options)],
        }).compile();

        const logger = moduleRef.get<Bunyan>(LOGGER);
        logger.info({ customField });

        expect(spy.mock.calls[0][0]).toHaveProperty('customField', customField);
        expect(spy.mock.calls[0][0]).toHaveProperty(
          'newParent.newSecondParent',
          customField,
        );
      });

      it('should replace the original value with mapped new value', async () => {
        const customField = 'custom-value';
        const spy = jest
          .spyOn(Bunyan.prototype as any, '_emit')
          .mockImplementation();

        const options: LoggerConfig = {
          name: 'test-app',
          streamType: 'STDOUT',
          transformers: [{ map: { customField: 'new-value' } }],
        };

        const moduleRef = await Test.createTestingModule({
          imports: [LoggerModule.forRoot(options)],
        }).compile();

        const logger = moduleRef.get<Bunyan>(LOGGER);
        logger.info({ customField });

        expect(spy.mock.calls[0][0]).toHaveProperty('customField', 'new-value');
      });

      it('should replace the one level embedded original value with mapped new value', async () => {
        const customField = 'custom-value';
        const spy = jest
          .spyOn(Bunyan.prototype as any, '_emit')
          .mockImplementation();

        const options: LoggerConfig = {
          name: 'test-app',
          streamType: 'STDOUT',
          transformers: [{ map: { ['parentField.customField']: 'new-value' } }],
        };

        const moduleRef = await Test.createTestingModule({
          imports: [LoggerModule.forRoot(options)],
        }).compile();

        const logger = moduleRef.get<Bunyan>(LOGGER);
        logger.info({ parentField: { customField } });

        expect(spy.mock.calls[0][0]).toHaveProperty(
          'parentField.customField',
          'new-value',
        );
      });

      it('should ignore the remaining embedded field name specification when transform type is map', async () => {
        const customField = 'custom-value';
        const spy = jest
          .spyOn(Bunyan.prototype as any, '_emit')
          .mockImplementation();

        const options: LoggerConfig = {
          name: 'test-app',
          streamType: 'STDOUT',
          transformers: [
            { map: { ['parentField.secondParent.customField']: 'new-value' } },
          ],
        };

        const moduleRef = await Test.createTestingModule({
          imports: [LoggerModule.forRoot(options)],
        }).compile();

        const logger = moduleRef.get<Bunyan>(LOGGER);
        logger.info({ parentField: { secondParent: { customField } } });

        expect(spy.mock.calls[0][0]).toHaveProperty(
          'parentField.secondParent',
          'new-value',
        );
      });

      it('should apply map function to the target field', async () => {
        const customField = 'custom-value';
        const spy = jest
          .spyOn(Bunyan.prototype as any, '_emit')
          .mockImplementation();

        const options: LoggerConfig = {
          name: 'test-app',
          streamType: 'STDOUT',
          transformers: [
            { map: { customField: (oldValue) => oldValue + '-transformed' } },
          ],
        };

        const moduleRef = await Test.createTestingModule({
          imports: [LoggerModule.forRoot(options)],
        }).compile();

        const logger = moduleRef.get<Bunyan>(LOGGER);
        logger.info({ customField });

        expect(spy.mock.calls[0][0]).toHaveProperty(
          'customField',
          customField + '-transformed',
        );
      });

      it('should apply map function to the target embedded field', async () => {
        const customField = 'custom-value';
        const spy = jest
          .spyOn(Bunyan.prototype as any, '_emit')
          .mockImplementation();

        const options: LoggerConfig = {
          name: 'test-app',
          streamType: 'STDOUT',
          transformers: [
            {
              map: {
                ['parentField.customField']: (oldValue) =>
                  oldValue + '-transformed',
              },
            },
          ],
        };

        const moduleRef = await Test.createTestingModule({
          imports: [LoggerModule.forRoot(options)],
        }).compile();

        const logger = moduleRef.get<Bunyan>(LOGGER);
        logger.info({ parentField: { customField } });

        expect(spy.mock.calls[0][0]).toHaveProperty(
          'parentField.customField',
          customField + '-transformed',
        );
      });

      it('should skip the process when the target transform is not supported', async () => {
        const customField = 'custom-value';
        const spy = jest
          .spyOn(Bunyan.prototype as any, '_emit')
          .mockImplementation();

        const options: LoggerConfig = {
          name: 'test-app',
          streamType: 'STDOUT',
          transformers: [{ notSupported: { customField } }],
        };

        const moduleRef = await Test.createTestingModule({
          imports: [LoggerModule.forRoot(options)],
        }).compile();

        const logger = moduleRef.get<Bunyan>(LOGGER);
        logger.info({ transactionId: 'test-transaction-id' });

        expect(spy.mock.calls[0][0]).not.toHaveProperty('customField');
      });
    });

    describe('buildLogger', () => {
      it('should process multiple transforms based on input order', async () => {
        const originalField = 'original-value';
        const customField = 'custom-value';

        const transformers = [
          {
            constant: { customField },
          },
          {
            clone: { originalField: 'customField' },
          },
          {
            map: { originalField: (oldValue) => oldValue + 'transformed' },
          },
        ];

        const spy = jest
          .spyOn(Bunyan.prototype as any, '_emit')
          .mockImplementation();

        const options: LoggerConfig = {
          name: 'test-app',
          streamType: 'STDOUT',
          transformers,
        };

        const moduleRef = await Test.createTestingModule({
          imports: [LoggerModule.forRoot(options)],
        }).compile();

        const logger = moduleRef.get<Bunyan>(LOGGER);
        logger.info({ originalField });

        expect(spy.mock.calls[0][0]).toHaveProperty(
          'customField',
          originalField,
        );

        expect(spy.mock.calls[0][0]).toHaveProperty(
          'originalField',
          originalField + 'transformed',
        );
      });
    });

    describe('createBunyanLogger', () => {
      it('should also allow child logger to apply transformers', async () => {
        const customField = 'custom-value';
        const spy = jest
          .spyOn(Bunyan.prototype as any, '_emit')
          .mockImplementation();

        const options: LoggerConfig = {
          name: 'test-app',
          streamType: 'STDOUT',
          transformers: [{ constant: { customField } }],
        };

        const moduleRef = await Test.createTestingModule({
          imports: [LoggerModule.forRoot(options)],
        }).compile();

        const logger = moduleRef.get<Bunyan>(LOGGER);
        const childLogger = logger.child({ context: 'child' });
        childLogger.info({ transactionId: 'test-transaction-id' });

        expect(spy.mock.calls[0][0]).toHaveProperty('customField', customField);
        expect(spy.mock.calls[0][0]).toHaveProperty('context', 'child');
      });
    });
  });
});
