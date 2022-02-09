import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import * as Bunyan from 'bunyan';
import * as Express from 'express';
import { getClientIp } from 'request-ip';
import { ServerResponse } from 'http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { LoggerConfig } from './logger.interfaces';

export class RequestInterceptor implements NestInterceptor {
  private readonly _logger: Bunyan;

  constructor(rootLogger: Bunyan, private readonly options: LoggerConfig) {
    this._logger = rootLogger.child({
      context: options.context || 'RequestTrack',
    });
  }

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const start = new Date();
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Express.Request>();
    const res = ctx.getResponse<ServerResponse>();
    const method = req.method;
    const url = req.url;
    const route = req.route.path;

    const reqId = this.options.genReqId
      ? this.options.genReqId(req)
      : req.headers[this.options.reqIdHeader || 'x-transaction-id'];
    const data: { [key: string]: any } = {
      method,
      url,
      route,
      req_id: reqId,
      transactionId: reqId,
    };

    data.ip = getClientIp(req);

    // TODO short body?
    data.headers = { ...req.headers };

    for (const h of this.options.excludeHeaders || []) {
      delete data.headers[h];
    }

    // TODO is it better to feed req to the bunyan.stdSerializers.req?
    this._logger.info({ direction: 'inbound', ...data });

    return next.handle().pipe(
      tap(() => {
        const ms = new Date().valueOf() - start.valueOf();
        this._logger.info({
          direction: 'outbound',
          'status-code': res.statusCode,
          'response-time': ms,
          method,
          route,
          url,
          req_id: reqId,
          transactionId: reqId,
        });
      }),
    );
  }
}
