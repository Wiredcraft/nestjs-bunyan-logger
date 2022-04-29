import { ModuleMetadata } from '@nestjs/common/interfaces';
import { Request } from 'express';

export type Transformer = Record<string, any>;

export interface LoggerConfig {
  name: string;
  streamType?: string;
  path?: string;
  errWithStack?: boolean;
  context?: string;
  excludeHeaders?: string[];
  reqIdHeader?: string;
  genReqId?: (r: Request) => string;
  excludeReqPath?: string;
  transformers?: Transformer[];
  avoidChildTransform?: boolean;
  shortBodyLength?: number;
}

export interface LoggerConfigAsync extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<LoggerConfig> | LoggerConfig;
  inject?: any[];
}
