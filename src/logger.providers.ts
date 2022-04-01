import { Provider } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import * as Bunyan from 'bunyan';

import { LOGGER, LOGGER_OPTIONS } from './constants';
import { RequestInterceptor } from './logger.interceptor';
import {
  LoggerConfig,
  LoggerConfigAsync,
  Transfomer,
} from './logger.interfaces';

// Those fields should not be overridden by the transfomers.
const coreFields = ['v', 'level', 'time'];

const isObject = (obj: any) => {
  return obj === Object(obj);
};

const reducer = (
  acc: Record<string, any>,
  cur: Record<string, any>,
): Record<string, any> => {
  // Handle constant: simply copy value.
  if (cur.constant) {
    return Object.assign({}, acc, cur.constant);
  }

  // Handle clone: copy value from original field name to a new field name.
  // Note: we don't remove the original key from the log object.
  if (cur.clone && isObject(cur.clone)) {
    const kv = cur.clone;
    Object.keys(kv).map((k) => {
      const destKey = kv[k];
      // nested field, only support the 1st level
      if (destKey.indexOf('.') > -1) {
        const [first, second] = destKey.split('.');
        acc[first] = {};
        acc[first][second] = acc[k];
      } else {
        acc[destKey] = acc[k];
      }
    });
    return acc;
  }

  // Handle map: applying mapper function to a target field's value.
  if (cur.map && isObject(cur.map)) {
    const kv = cur.map;
    Object.keys(kv).map((k) => {
      if (coreFields.includes(k)) {
        throw new Error(`${k} is core field, can not be overridden`);
      }
      const v = kv[k];
      // nested field, only support the 1st level
      if (k.indexOf('.') > -1) {
        const [first, second] = k.split('.');
        acc[first][second] =
          typeof v === 'function' ? v(acc[first][second]) : v;
      } else {
        acc[k] = typeof kv[k] === 'function' ? v(acc[k]) : v;
      }
    });
    return acc;
  }

  // Unsupported action, simply return the original value.
  return acc;
};

const buildLogger = (logger: Bunyan, transformers: Transfomer[]) => {
  // @ts-ignore
  logger._emit = (record: Record<string, any>, noemit) => {
    const transformedRec = transformers.reduce(reducer, record);
    // @ts-ignore
    Bunyan.prototype._emit.call(logger, transformedRec, noemit);
  };
  return logger;
};

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
  let logger = Bunyan.createLogger({
    name: config.name,
    streams,
    serializers: {
      // customize err serializer coz buyan std err serializer doesn't work without err.stack
      err: config.errWithStack
        ? Bunyan.stdSerializers.err
        : noStackErrSerializers,
      req: Bunyan.stdSerializers.req,
      res: Bunyan.stdSerializers.res,
    },
  });

  // Overwrite the _emit function to apply the customized transformer.
  if (config.transformers && Array.isArray(config.transformers)) {
    logger = buildLogger(logger, config.transformers);
    if (!config.avoidChildTransform) {
      Bunyan.prototype.child = function (options, simple) {
        const logger = new this.constructor(this, options || {}, simple);
        return buildLogger(logger, config.transformers);
      };
    }
  }

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
