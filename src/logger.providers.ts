import { Provider } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import * as Bunyan from 'bunyan';
import process from 'process';

import { LOGGER, LOGGER_OPTIONS } from './constants';
import { RequestInterceptor } from './logger.interceptor';
import { LoggerConfig, LoggerConfigAsync } from './logger.interfaces';

const noStackErrSerializers = function (err: {
  message: string;
  name: string;
  code?: number | string;
}) {
  return { message: err.message, name: err.name, code: err.code };
};

const createBunyanLogger = (config: LoggerConfig) => {
  let streams: any[];

  if (config.streamType && config.streamType.toUpperCase() === 'FILE') {
    streams = [{ path: config.path || './logs/app.log' }];
  } else {
    streams = [{ stream: process.stdout }]; // non-found, default
  }
  const logger = Bunyan.createLogger({
    name: config.name,
    streams,
    serializers: {
      // customize err serializer coz buyan std err serializer doesn't work without err.stack
      err:
        process.env.NODE_ENV === 'production'
          ? noStackErrSerializers
          : Bunyan.stdSerializers.err,
      req: Bunyan.stdSerializers.req,
      res: Bunyan.stdSerializers.res,
    },
  });
  return logger;
};

const createLoggerProvider = (): Provider => {
  return {
    provide: LOGGER,
    useFactory: async (config: LoggerConfig) => {
      return createBunyanLogger(config);
    },
    inject: [LOGGER_OPTIONS],
  };
};

const createRequestInterceptor = (): Provider => {
  return {
    provide: APP_INTERCEPTOR,
    inject: [LOGGER_OPTIONS, LOGGER],
    useFactory: (options: LoggerConfig, logger: Bunyan) =>
      new RequestInterceptor(logger, options),
  };
};

export const createProviders = (options: LoggerConfig) => {
  const providers = [
    {
      provide: LOGGER_OPTIONS,
      useValue: options,
    },
    createLoggerProvider(),
    createRequestInterceptor(),
  ];
  return providers;
};

export const createProvidersAsync = (options: LoggerConfigAsync) => {
  const providers = [
    {
      provide: LOGGER_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject || [],
    },
    createLoggerProvider(),
    createRequestInterceptor(),
  ];
  return providers;
};
