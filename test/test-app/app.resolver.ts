import { ForbiddenException } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';

@Resolver('App')
export class AppResolver {
  @Query(() => String)
  async hello() {
    return 'hello';
  }

  @Query(() => String)
  async forbid() {
    throw new ForbiddenException();
  }
}
