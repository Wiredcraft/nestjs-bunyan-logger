import { Controller, Get } from '@nestjs/common';

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
}
