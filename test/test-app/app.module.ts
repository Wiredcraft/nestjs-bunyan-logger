import { Module } from '@nestjs/common';
import { LoggerModule } from '../../src';
import { AppController } from './app.controller';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AppResolver } from './app.resolver';

@Module({
  imports: [
    LoggerModule.forRoot({
      name: 'awesome-app',
      streamType: 'STDOUT',
      excludeReqPath: '/health',
      shortBodyLength: 100,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground: true,
      autoSchemaFile: true,
      sortSchema: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppResolver],
})
export class AppModule {}
