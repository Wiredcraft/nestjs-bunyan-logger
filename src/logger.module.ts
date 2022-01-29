import { DynamicModule, Global, Module } from '@nestjs/common';

import { LOGGER } from './constants';
import { LoggerConfig, LoggerConfigAsync } from './logger.interfaces';
import { createProviders, createProvidersAsync } from './logger.providers';

@Global()
@Module({})
export class LoggerModule {
  static forRoot(options: LoggerConfig): DynamicModule {
    const providers = createProviders(options);
    return {
      module: LoggerModule,
      providers,
      exports: [LOGGER],
    };
  }

  static forRootAsync(options: LoggerConfigAsync): DynamicModule {
    const providers = createProvidersAsync(options);
    return {
      module: LoggerModule,
      providers,
      exports: [LOGGER],
      imports: options.imports,
    };
  }
}
