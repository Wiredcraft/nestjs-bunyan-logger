import {
  Controller,
  Get,
  Post,
  ForbiddenException,
  Body,
} from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return 'hello';
  }
  @Get('/health')
  getHealthStatus(): string {
    return 'ok';
  }
  @Get('/forbid')
  getNotAllowd(): string {
    throw new ForbiddenException();
  }
  @Post('/cats')
  createCat(@Body() body) {
    return { data: body };
  }
}
