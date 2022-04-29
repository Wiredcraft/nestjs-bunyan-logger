import { Module } from '@nestjs/common';
import { LoggerModule } from '../../src';
import { AppController } from './app.controller';

@Module({
  imports: [
    LoggerModule.forRoot({
      name: 'awesome-app',
      streamType: 'STDOUT',
      excludeReqPath: '/health',
      shortBodyLength: 100,
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
