# Description

A logger module for [Nestjs](https://github.com/nestjs/nest), built on top of [node-bunyan](https://github.com/trentm/node-bunyan).

# Features

* A gloabl bunyan logger provider can be used in the controllers/services.
* Automatically log request/response with `request-id`, `timestamp`, `status-code`, etc.

# Usage

## Installation

### Yarn
```
yarn add @wiredcraft/nestjs-bunyan-logger
```

### NPM
```
npm install @wiredcraft/nestjs-bunyan-logger --save
```

## Integration

1. Import `LoggerModule` in the root App module, this provides initialized bunyan logger instance that is available to other modules by injection.

```typescript
import { Module } from '@nestjs/common';
import { LoggerConfig, LoggerModule } from '@wiredcraft/nestjs-bunyan-logger';
import configuration from './src/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return configService.get<LoggerConfig>('logger', { infer: true });
      },
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

A sample configuration file is as below,
```typescript
export default () => ({
  logger: {
      name: 'awesome-app',
      streamType: 'FILE' | 'STDOUT',
      path: './logs/app.log', // only available for `FILE` streamType
      excludeReqPath: '/health', // the path that you want to skip logging
  }
});

```


2. Inject the logger instance to your service and use it as you want.

```typescript
import { Injectable } from '@nestjs/common';
import { Logger, Bunyan  } from '@wiredcraf/nestjs-bunyan-logger';

@Injectable()
export class CatService {
  constructor(
    @Logger() private logger: Bunyan,
  ) {
  }
}
```

# Development

## Installation

```bash
$ yarn install
```

## Publish

``` bash
$ npm version major|minor|patch
$ npm publish
```

## License

[MIT licensed](LICENSE).
