import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import * as Bunyan from 'bunyan';
import * as Express from 'express';
import { ServerResponse } from 'http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { LoggerConfig } from './logger.interfaces';

export class RequestInterceptor implements NestInterceptor {
  private readonly _logger: Bunyan;

  constructor(rootLogger: Bunyan, private readonly options: LoggerConfig) {
    this._logger = rootLogger.child({
      category: options.requestTrackCategory || 'RequestTrack',
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
      : req.headers['x-transaction-id'];
    const data: { [key: string]: any } = {
      method,
      url,
      route,
      req_id: reqId,
    };

    // TODO use https://github.com/pbojinov/request-ip
    data.ip = req.ip || (req.socket && req.socket.remoteAddress) || '127.0.0.1';

    // TODO short body?
    data.headers = { ...req.headers };

    for (const h of this.options.excludeHeaders || []) {
      delete data.headers[h];
    }

    this._logger.info({ incoming: 'req', ...data });

    return next.handle().pipe(
      tap(() => {
        const ms = new Date().valueOf() - start.valueOf();
        this._logger.info({
          imcoming: 'resp',
          'status-code': res.statusCode,
          ms,
          method,
          route,
          url,
          req_id: reqId,
        });
      }),
    );
  }
}
